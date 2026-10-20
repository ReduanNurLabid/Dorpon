import 'dart:convert';
import 'dart:math' as math;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:http/http.dart' as http;
import '../models/capsule_models.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:8000';
  static const String firestoreRestBase =
      'https://firestore.googleapis.com/v1/projects/dorpon-a99a6/databases/(default)/documents';
  // Disabled by default to avoid ERR_CONNECTION_REFUSED in browser/standalone mode when no local backend runs
  static const bool enableLocalHttpFallback = false;

  /// Helper to decode typed values from the Firestore REST API
  static dynamic _decodeFirestoreValue(Map<String, dynamic> val) {
    if (val.containsKey('stringValue')) return val['stringValue'];
    if (val.containsKey('integerValue')) return int.tryParse(val['integerValue'].toString()) ?? 0;
    if (val.containsKey('doubleValue')) return (val['doubleValue'] as num).toDouble();
    if (val.containsKey('booleanValue')) return val['booleanValue'];
    if (val.containsKey('timestampValue')) return val['timestampValue'];
    if (val.containsKey('arrayValue')) {
      final list = val['arrayValue']['values'] as List? ?? [];
      return list.map((item) => item is Map<String, dynamic> ? _decodeFirestoreValue(item) : item).toList();
    }
    if (val.containsKey('mapValue')) {
      final fields = val['mapValue']['fields'] as Map<String, dynamic>? ?? {};
      return fields.map((k, v) => MapEntry(k, v is Map<String, dynamic> ? _decodeFirestoreValue(v) : v));
    }
    if (val.containsKey('nullValue')) return null;
    return val;
  }

  /// Helper to convert a raw Firestore REST document into a clean Map
  static Map<String, dynamic> _decodeFirestoreDoc(Map<String, dynamic> doc) {
    final fields = doc['fields'] as Map<String, dynamic>? ?? {};
    final result = <String, dynamic>{};
    fields.forEach((key, val) {
      if (val is Map<String, dynamic>) {
        result[key] = _decodeFirestoreValue(val);
      } else {
        result[key] = val;
      }
    });
    return result;
  }

  /// REST fallback: fetches entire collection without WebChannel (ad-blocker immune)
  static Future<List<CapsuleStory>> _fetchFirestoreRest(String collection, {int pageSize = 40}) async {
    try {
      final url = '$firestoreRestBase/$collection?pageSize=$pageSize';
      final resp = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 6));
      if (resp.statusCode == 200) {
        final data = json.decode(utf8.decode(resp.bodyBytes)) as Map<String, dynamic>;
        final docs = data['documents'] as List? ?? [];
        final stories = docs
            .whereType<Map<String, dynamic>>()
            .map((d) => CapsuleStory.fromJson(_decodeFirestoreDoc(d)))
            .toList();
        return stories;
      }
    } catch (e) {
      // Ignore
    }
    return [];
  }

  /// REST fallback: fetches a single document without WebChannel
  static Future<Map<String, dynamic>?> _fetchFirestoreDocRest(String collection, String docId) async {
    try {
      final url = '$firestoreRestBase/$collection/$docId';
      final resp = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 6));
      if (resp.statusCode == 200) {
        final data = json.decode(utf8.decode(resp.bodyBytes)) as Map<String, dynamic>;
        return _decodeFirestoreDoc(data);
      }
    } catch (_) {}
    return null;
  }

  /// Fetches hourly 60-second news stories directly from Firestore collection 'daily_buzz'
  static Future<List<CapsuleStory>> fetchDailyBuzzFeed({String? interests}) async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('daily_buzz')
          .limit(50)
          .get()
          .timeout(const Duration(seconds: 8));

      if (snapshot.docs.isNotEmpty) {
        final List<CapsuleStory> stories = [];
        for (var doc in snapshot.docs) {
          final data = doc.data();
          stories.add(CapsuleStory.fromJson(data));
        }

        if (interests != null && interests.isNotEmpty) {
          final filterList = interests.split(',').map((e) => e.trim()).toList();
          final filtered = stories.where((s) => s.interestCategories.any((c) => filterList.contains(c))).toList();
          if (filtered.isNotEmpty) return _deduplicateStories(filtered);
        }

        return _deduplicateStories(stories);
      }
    } catch (e) {
      // Fall back if Firestore SDK request fails or is blocked by ad-blocker
    }

    // Direct Firestore REST Fallback (Ad-blocker & WebChannel immune)
    final restStories = await _fetchFirestoreRest('daily_buzz', pageSize: 50);
    if (restStories.isNotEmpty) {
      if (interests != null && interests.isNotEmpty) {
        final filterList = interests.split(',').map((e) => e.trim()).toList();
        final filtered = restStories.where((s) => s.interestCategories.any((c) => filterList.contains(c))).toList();
        if (filtered.isNotEmpty) return _deduplicateStories(filtered);
      }
      return _deduplicateStories(restStories);
    }

    // Secondary fallback: Local API server (if explicitly enabled)
    if (enableLocalHttpFallback) {
      try {
        final query = interests != null && interests.isNotEmpty ? '?interests=$interests' : '';
        final response = await http
            .get(Uri.parse('$baseUrl/api/feed/buzz$query'))
            .timeout(const Duration(seconds: 3));

        if (response.statusCode == 200) {
          final data = json.decode(utf8.decode(response.bodyBytes));
          final List storiesJson = data['stories'] ?? [];
          return _deduplicateStories(storiesJson.map((s) => CapsuleStory.fromJson(s)).toList());
        }
      } catch (_) {}
    }

    return _deduplicateStories(_getFallbackTopStories());
  }

  /// Fetches the latest published Current Affairs question-led editorial directly from Firestore
  static Future<List<CapsuleStory>> fetchBcsProFeed() async {
    try {
      final doc = await FirebaseFirestore.instance
          .collection('current_affairs_published')
          .doc('latest')
          .get()
          .timeout(const Duration(seconds: 8));

      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final List storiesJson = data['stories'] ?? [];
        if (storiesJson.isNotEmpty) {
          return storiesJson.map((s) => CapsuleStory.fromJson(s)).toList();
        }
      }
    } catch (e) {
      // Fall back
    }

    try {
      final doc = await FirebaseFirestore.instance
          .collection('bcs_pro_published')
          .doc('latest')
          .get()
          .timeout(const Duration(seconds: 8));

      if (doc.exists && doc.data() != null) {
        final data = doc.data()!;
        final List storiesJson = data['stories'] ?? [];
        if (storiesJson.isNotEmpty) {
          return storiesJson.map((s) => CapsuleStory.fromJson(s)).toList();
        }
      }
    } catch (e) {
      // Fall back
    }

    // Direct Firestore REST Fallback (Ad-blocker & WebChannel immune)
    final restDoc = await _fetchFirestoreDocRest('bcs_pro_published', 'latest');
    if (restDoc != null) {
      final List storiesJson = restDoc['stories'] ?? [];
      if (storiesJson.isNotEmpty) {
        return storiesJson.map((s) => CapsuleStory.fromJson(s)).toList();
      }
    }

    // Secondary fallback: Local API server (if explicitly enabled)
    if (enableLocalHttpFallback) {
      try {
        final response = await http
            .get(Uri.parse('$baseUrl/api/feed/current-affairs'))
            .timeout(const Duration(seconds: 3));

        if (response.statusCode == 200) {
          final data = json.decode(utf8.decode(response.bodyBytes));
          final List storiesJson = data['stories'] ?? [];
          return storiesJson.map((s) => CapsuleStory.fromJson(s)).toList();
        }
      } catch (_) {}
    }

    return _getFallbackCurrentAffairs();
  }

  /// Fetches hourly breaking wires from Firestore 'hourly_buzz' or API endpoint '/api/feed/hourly'
  static Future<List<CapsuleStory>> fetchHourlyWiresFeed() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('hourly_buzz')
          .limit(20)
          .get()
          .timeout(const Duration(seconds: 8));

      if (snapshot.docs.isNotEmpty) {
        final List<CapsuleStory> stories = [];
        for (var doc in snapshot.docs) {
          final data = doc.data();
          stories.add(CapsuleStory.fromJson(data));
        }
        if (stories.isNotEmpty) return _deduplicateStories(stories);
      }
    } catch (_) {}

    // Direct Firestore REST Fallback (Ad-blocker & WebChannel immune)
    final restWires = await _fetchFirestoreRest('hourly_buzz', pageSize: 25);
    if (restWires.isNotEmpty) {
      return _deduplicateStories(restWires);
    }

    if (enableLocalHttpFallback) {
      try {
        final response = await http
            .get(Uri.parse('$baseUrl/api/feed/hourly'))
            .timeout(const Duration(seconds: 3));

        if (response.statusCode == 200) {
          final data = json.decode(utf8.decode(response.bodyBytes));
          final List storiesJson = data['stories'] ?? [];
          if (storiesJson.isNotEmpty) {
            return _deduplicateStories(storiesJson.map((s) => CapsuleStory.fromJson(s)).toList());
          }
        }
      } catch (_) {}
    }

    return _deduplicateStories(_getFallbackHourlyWires());
  }

  /// Fetches all historical news archive from Firestore collections 'daily_buzz' and 'hourly_buzz'
  static Future<List<CapsuleStory>> fetchAllNewsArchive() async {
    final Map<String, CapsuleStory> storyMap = {};

    try {
      final snapDaily = await FirebaseFirestore.instance
          .collection('daily_buzz')
          .limit(50)
          .get()
          .timeout(const Duration(seconds: 8));

      for (var doc in snapDaily.docs) {
        final story = CapsuleStory.fromJson(doc.data());
        if (story.storyId.isNotEmpty) {
          storyMap[story.storyId] = story;
        }
      }
    } catch (_) {}

    try {
      final snapHourly = await FirebaseFirestore.instance
          .collection('hourly_buzz')
          .limit(50)
          .get()
          .timeout(const Duration(seconds: 8));

      for (var doc in snapHourly.docs) {
        final story = CapsuleStory.fromJson(doc.data());
        if (story.storyId.isNotEmpty && !storyMap.containsKey(story.storyId)) {
          storyMap[story.storyId] = story;
        }
      }
    } catch (_) {}

    if (storyMap.isNotEmpty) {
      final list = storyMap.values.toList();
      // Sort by publication time or ID
      list.sort((a, b) {
        final aTime = DateTime.tryParse(a.publishedAt) ?? DateTime(2020);
        final bTime = DateTime.tryParse(b.publishedAt) ?? DateTime(2020);
        return bTime.compareTo(aTime);
      });
      return _deduplicateStories(list);
    }

    // Fallbacks
    final fb1 = await fetchDailyBuzzFeed();
    final fb2 = await fetchHourlyWiresFeed();
    for (var s in [...fb1, ...fb2]) {
      storyMap[s.storyId] = s;
    }
    return _deduplicateStories(storyMap.values.toList());
  }

  static List<CapsuleStory> _getFallbackHourlyWires() {
    return [
      CapsuleStory(
        storyId: 'hourly-rohingya-repatriation',
        primaryCategory: 'governance_law',
        interestCategories: ['governance_law', 'world_diplomacy'],
        tags: ['#RohingyaRepatriation', '#Diplomacy', '#UNSupport'],
        isBcsProSelected: false,
        sources: [
          {'name': 'Dhaka Tribune', 'url': 'https://www.dhakatribune.com/bangladesh/foreign-affairs/422498/home-minister-calls-for-global-support-for'}
        ],
        dailyBuzz: DailyBuzzItem(
          titleEn: 'Home Minister Calls for Global Support for Rohingya Repatriation',
          titleBn: 'রোহিঙ্গা প্রত্যাবাসনে বৈশ্বিক জোরালো সমর্থন চাইলেন স্বরাষ্ট্রমন্ত্রী',
          summaryEn: 'Home Minister Salahuddin Ahmed has urged the international community to play a more effective role in ensuring the sustainable repatriation of displaced Myanmar nationals during a meeting with the UN Secretary-General\'s Special Envoy.',
          summaryBn: 'স্বরাষ্ট্রমন্ত্রী সালাহউদ্দিন আহমেদ মিয়ানমারের নাগরিকদের টেকসই প্রত্যাবাসন নিশ্চিত করতে আন্তর্জাতিক সম্প্রদায়ের প্রতি আরও কার্যকর ভূমিকা পালনের আহ্বান জানিয়েছেন।',
          whyItMattersEn: 'The prolonged refugee crisis poses multifaceted security and economic pressures on southeastern Bangladesh.',
          whyItMattersBn: 'রোহিঙ্গা সংকট জাতীয় নিরাপত্তা ও অর্থনীতিতে দীর্ঘমেয়াদী নেতিবাচক প্রভাব ফেলছে যা নিরসনে বৈশ্বিক চাপ জরুরি।',
          interestCategories: ['governance_law', 'world_diplomacy'],
          readTimeSeconds: 60,
        ),
      ),
      CapsuleStory(
        storyId: 'hourly-state-family-business',
        primaryCategory: 'economy_business',
        interestCategories: ['economy_business', 'governance_law'],
        tags: ['#Governance', '#PublicInstitutions', '#Accountability'],
        isBcsProSelected: false,
        sources: [
          {'name': 'Dhaka Tribune', 'url': 'https://www.dhakatribune.com/opinion/longform/422422/when-the-state-becomes-a-family-business'}
        ],
        dailyBuzz: DailyBuzzItem(
          titleEn: 'When the State Risks Becoming a Personalized Enterprise',
          titleBn: 'যখন রাষ্ট্র হয়ে ওঠে ব্যক্তিগতকৃত অর্থনৈতিক কাঠামো',
          summaryEn: 'Democratic institutions face systemic strain when familial ties and patron-client networks dictate resource allocation and executive decisions.',
          summaryBn: 'গণতান্ত্রিক প্রতিষ্ঠান ও প্রশাসন যখন সংকীর্ণ রাজনৈতিক পৃষ্ঠপোষকতা ও ব্যক্তিগত সম্পর্কের ওপর নির্ভরশীল হয়ে পড়ে তখন সুশাসন বিপন্ন হয়।',
          whyItMattersEn: 'Institutional meritocracy and public asset stewardship are foundational to investor confidence.',
          whyItMattersBn: 'মেধাভিত্তিক প্রশাসনিক নিয়োগ ও স্বচ্ছতা অর্থনৈতিক টেকসই প্রবৃদ্ধির অন্যতম প্রধান শর্ত।',
          interestCategories: ['economy_business', 'governance_law'],
          readTimeSeconds: 60,
        ),
      ),
    ];
  }

  static List<CapsuleStory> _getFallbackTopStories() {
    return [
      CapsuleStory(
        storyId: 'top-story-france-uprising-2026',
        primaryCategory: 'international_diplomacy',
        interestCategories: ['international_diplomacy', 'economy_business', 'governance_law'],
        tags: ['#FranceProtests', '#CostOfLiving', '#EuropeUnrest', '#PoliceAccountability', '#GlobalEconomy'],
        imageUrl: 'https://media.prothomalo.com/prothomalo-bangla%2F2026-10-19%2Fcbi3n0l6%2FEU-Unrest-1.jpg?rect=0%2C68%2C960%2C504&w=1200&ar=40%3A21&auto=format%2Ccompress&ogImage=true&mode=crop',
        imageCaption: 'A burning vehicle amidst intense clashes between protesters and security personnel in Paris. Photo: Reuters / Prothom Alo',
        isBcsProSelected: false,
        sources: [
          {'name': 'Prothom Alo World Desk', 'url': 'https://www.prothomalo.com/world/europe/8nb3n8zdwd'},
          {'name': 'The Guardian / Wire', 'url': 'http://prothomalo.com/world/europe/vlbce6rg73'},
          {'name': 'Rokhaya Diallo Column', 'url': 'https://www.prothomalo.com/opinion/column/kalzgtfo9f'}
        ],
        dailyBuzz: DailyBuzzItem(
          titleEn: 'France in Turmoil: Runaway Cost-of-Living Protests Escalate into Mass Unrest; Partial Curfews Imposed',
          titleBn: 'উত্তাল ফ্রান্স: জীবনযাত্রার ব্যয়বৃদ্ধিতে সহিংস বিক্ষোভ, এলাকাভিত্তিক কারফিউ জারি',
          summaryEn: 'Massive protests sparked by escalating energy costs, runaway inflation, and deepening public dissatisfaction with purchasing power have swept across France, escalating into some of the most violent domestic unrest in recent European history.\n\nOver the weekend, over 500,000 demonstrators inundated the streets of Paris, Lille, Lyon, and Marseille. In key metropolitan centers, peaceful demonstrations rapidly transformed into fiery confrontations as barricades were erected, luxury storefronts were ransacked, and public infrastructure was heavily vandalized.\n\nFollowing an emergency Sunday security cabinet session, Prime Minister Sébastien Lecornu confirmed that local prefects have been authorized to institute targeted night curfews in severely affected districts, acknowledging that conventional riot police had lost control over several urban sectors. Interior Minister Laurent Nuñez conceded that law enforcement suffered from critical tactical miscalculations and personnel shortages.',
          summaryBn: 'জীবনযাত্রার ব্যয়বৃদ্ধি ও লাগামহীন মূল্যস্ফীতির প্রতিবাদে উত্তাল হয়ে উঠেছে গোটা ফ্রান্স। দেশটির রাজধানী প্যারিস ছাড়াও লিল, মার্সেই ও লিওঁ শহরে বিক্ষোভকারীরা রাস্তায় নেমে আসেন। গোয়েন্দা সংস্থাগুলো দুই লাখ জমায়েতের পূর্বাভাস দিলেও বাস্তবে পাঁচ লাখের বেশি মানুষ বিক্ষোভে অংশ নেন।\n\nপরিস্থিতি সামাল দিতে গিয়ে কয়েকটি শহরে পুলিশের নিয়ন্ত্রণ ভেঙে পড়ে। প্যারিসসহ গুরুত্বপূর্ণ শহরগুলোতে গাড়িতে আগুন, দোকানপাট ভাঙচুর ও সরকারি সম্পদে ব্যাপক ক্ষতিসাধন করা হয়। এই পরিস্থিতিতে প্রধানমন্ত্রী সেবাস্তিয়াঁ লেকর্নু মন্ত্রিসভার জরুরি বৈঠকের পর এলাকাভিত্তিক আংশিক কারফিউ জারির নির্দেশ দিয়েছেন এবং প্রয়োজনে জাতীয় জরুরি অবস্থা জারির হুমকি দিয়েছেন।',
          whyItMattersEn: '1. European Economic Contagion: Prolonged industrial disruption and urban paralyzation in the EU\'s second-largest economy threaten regional supply chains and investor confidence.\n2. Crisis of Democratic Policing: France faces severe scrutiny from Amnesty International and the UN over militarized crowd-control doctrines.\n3. Political Fragility: Prime Minister Lecornu’s reliance on curfews underscores how inflation-driven cost-of-living crises can rapidly destabilize governing coalitions.',
          whyItMattersBn: '১. ইউরোপীয় অর্থনীতিতে প্রভাব: ইউরোপের দ্বিতীয় বৃহত্তম অর্থনীতির এই অচলাবস্থা আঞ্চলিক সরবরাহ চেইনে বড় চাপ তৈরি করছে।\n২. পুলিশি জবাবদিহিতা ও মানবাধিকার: তরুণ ও অধিকারকর্মীদের ওপর নির্বিচার টিয়ার গ্যাস ও বুলেট ব্যবহারের ফলে রাষ্ট্রীয় কাঠামোর ওপর জনআস্থা নজিরবিহীনভাবে হ্রাস পেয়েছে।\n৩. রাজনৈতিক স্থায়িত্ব: নিত্যপণ্যের মূল্যবৃদ্ধি নিয়ন্ত্রণে ব্যর্থ হলে যেকোনো সরকার গভীর রাজনৈতিক অস্তিত্ব সংকটে পড়তে পারে—ফ্রান্স তারই বাস্তব প্রমাণ।',
          interestCategories: ['international_diplomacy', 'economy_business', 'governance_law'],
          readTimeSeconds: 180,
        ),
      ),
      CapsuleStory(
        storyId: 'top-story-cuet-deadlock-2026',
        primaryCategory: 'governance_law',
        interestCategories: ['governance_law', 'national_policy', 'higher_education'],
        tags: ['#HigherEducation', '#CampusCrisis', '#UGCBangladesh', '#CUETDeadlock'],
        imageUrl: 'https://media.prothomalo.com/prothomalo-bangla%2F2026-10-19%2Fcbi3n0l6%2FEU-Unrest-1.jpg?rect=0%2C68%2C960%2C504&w=1200&ar=40%3A21&auto=format%2Ccompress&ogImage=true&mode=crop',
        imageCaption: 'CUET campus remains shut amidst administrative vacuum. Photo: Prothom Alo',
        isBcsProSelected: false,
        sources: [
          {'name': 'Prothom Alo Chittagong', 'url': 'https://www.prothomalo.com/bangladesh/dzfhtu7pes'}
        ],
        dailyBuzz: DailyBuzzItem(
          titleEn: 'CUET Stalemate Enters Second Month: UGC Forms 6-Member High-Powered Advisory Body',
          titleBn: 'চুয়েটে এক মাসের বেশি অচলাবস্থা: সংকট নিরসনে ইউজিসির ৬ সদস্যের পরামর্শক কমিটি',
          summaryEn: 'Academic and administrative activities at Chittagong University of Engineering and Technology (CUET) have remained paralyzed for over a month following the government\'s abrupt removal of Vice-Chancellor Prof. Dr. Mohammad Sayeem after merely 56 days.\n\nThe unprecedented administrative vacuum has shuttered all academic departments, halted examinations, and locked laboratory facilities, leaving over 4,500 engineering students in deep anxiety regarding prolonged session jams.\n\nThe UGC of Bangladesh has established a 6-member high-level advisory committee headed by senior member Prof. Dr. Mohammad Abdullah-al-Mamun to conduct on-site stakeholder hearings and restore stability.',
          summaryBn: 'মাত্র ৫৬ দিনের মাথায় উপাচার্য অধ্যাপক ড. মোহাম্মদ সাঈমকে দায়িত্ব থেকে অব্যাহতি দেওয়ার পর চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়ে (চুয়েট) এক মাসেরও বেশি সময় ধরে অচলাবস্থা বিরাজ করছে। ফলে ৪ সহস্রাধিক প্রকৌশল শিক্ষার্থীর শিক্ষাজীবন তীব্র সেশনজটের শঙ্কায় পড়েছে। সংকট নিরসনে ইউজিসি ৬ সদস্যের পরামর্শক কমিটি গঠন করেছে।',
          whyItMattersEn: '1. Engineering Workforce Delays: Session jams at premier technical institutions directly impede Bangladesh’s industrial engineering pipeline.\n2. University Governance Vulnerability: Frequent top-level administrative churn exposes the need for systemic university governance reform.\n3. Institutional Autonomy: Tests UGC\'s capacity to mediate complex campus standoffs without political deadlocks.',
          whyItMattersBn: '১. প্রকৌশল শিক্ষায় সেশনজট: চুয়েটের মতো শীর্ষ প্রযুক্তি বিদ্যাপীঠ বন্ধ থাকা মানে দেশের অবকাঠামো ও শিল্প খাতের গ্র্যাজুয়েট সরবরাহ পিছিয়ে পড়া।\n২. সুশাসন ও উপাচার্য নিয়োগ: স্বচ্ছ নীতিমালার অভাবে ঘনঘন শীর্ষ পদে রদবদল পাবলিক বিশ্ববিদ্যালয়ের সক্ষমতা ধ্বংস করে।',
          interestCategories: ['governance_law', 'national_policy', 'higher_education'],
          readTimeSeconds: 140,
        ),
      ),
    ];
  }

  static List<CapsuleStory> _getFallbackCurrentAffairs() {
    return [
      CapsuleStory(
        storyId: 'story-houthi-saudi-bangladesh-2026',
        primaryCategory: 'international_diplomacy',
        interestCategories: ['international_diplomacy', 'economy_business', 'governance_law'],
        tags: ['#Geopolitics', '#RedSeaCrisis', '#MigrantLabor', '#EnergySecurity', '#TradeCorridors'],
        isBcsProSelected: true,
        sources: [
          {
            'name': 'Ministry of Foreign Affairs (MOFA)',
            'url': 'https://mofa.gov.bd',
            'snippet': 'Official diplomatic statement condemning Houthi strikes on civilian targets as violations of international law.'
          },
          {
            'name': 'Civil Aviation Authority of Bangladesh (CAAB)',
            'url': 'http://caab.portal.gov.bd',
            'snippet': 'Emergency aviation crisis management and worker transit protocols at Dhaka airport.'
          },
          {
            'name': 'Bangladesh Shipping Corporation (BSC)',
            'url': 'https://bsc.gov.bd',
            'snippet': 'MT Ninemia operational logs detouring Cape of Good Hope to evade Red Sea strikes.'
          }
        ],
        dailyBuzz: DailyBuzzItem(
          titleBn: 'হুথি-সৌদি সংঘাত ও বাংলাদেশ: প্রবাসী শ্রমিকের সংকট, সমুদ্রবাণিজ্য ও এমএমডিসি সামরিক জোট',
          titleEn: 'Houthi–Saudi Conflict & Bangladesh: Labor Vulnerability, Red Sea Transit, and the MMDC Alliance',
          summaryBn: 'হুথি ও সৌদি আরবের মধ্যকার ক্রমবর্ধমান সংঘাত বাংলাদেশের প্রবাসী শ্রমিকদের নিরাপত্তা, সমুদ্রবাণিজ্যের সাপ্লাই চেইন এবং কৌশলগত প্রতিরক্ষায় বড় সংকট তৈরি করেছে। সৌদি আরবের অর্থনৈতিক স্থিতিশীলতা এবং লোহিত সাগরের নৌপথের ওপর নির্ভরশীলতার কারণে ঢাকা এক নজিরবিহীন ঝুঁকির মুখে পড়েছে।',
          summaryEn: 'The escalating Houthi–Saudi Arabian conflict is creating a direct crisis for Bangladesh across labor stability, supply chain security, and defense alignment. As Houthi drone and missile strikes disrupt deep infrastructure in the Kingdom, Dhaka finds itself uniquely exposed due to its dependency on Saudi economic stability and Red Sea maritime access.',
          whyItMattersBn: 'সৌদি আরব থেকে বছরে আসে ৫.৮৫ বিলিয়ন ডলারের রেমিট্যান্স এবং সেখানে কর্মরত প্রায় ৪০ লাখ বাংলাদেশি। পাশাপাশি উত্তমাশা অন্তরীপ ঘুরে আসায় জ্বালানি তেলবাহী প্রতি চালানে ব্যয় বাড়ছে ৬৬.৬৩ কোটি টাকা।',
          whyItMattersEn: 'Saudi Arabia supplies 20% of national remittances (\$5.85B) and hosts 4M Bangladeshi workers, while Cape reroutings cost an extra Tk 66.63 Cr per fuel voyage.',
          interestCategories: ['international_diplomacy', 'economy_business'],
          readTimeSeconds: 120,
        ),
        bcsPro: BcsProItem(
          syllabusMapping: SyllabusMapping(
            paperCode: 'Global Affairs',
            subject: 'International Geopolitics',
            microtheme: 'Houthi–Saudi Conflict & Bangladesh Strategic Exposure',
            fullBreadcrumb: 'Global Affairs › Houthi–Saudi Conflict & Bangladesh Strategic Exposure',
          ),
          bcsSubjectArea: 'Global Geopolitics › Middle East Security & Maritime Commerce',
          whyInTheNewsEn: 'The Houthi–Saudi Arabian conflict is escalating, creating a direct crisis for Bangladesh across labor stability, supply chain security, and defense alignment. As Houthi drone and missile strikes disrupt deep infrastructure in the Kingdom, Dhaka finds itself uniquely exposed due to its dependency on Saudi economic stability and Red Sea maritime access.',
          whyInTheNewsBn: 'হুথি ও সৌদি আরবের মধ্যকার সংঘাত তীব্র রূপ নিয়েছে, যা প্রবাসী শ্রমিকদের কর্মসংস্থান, জ্বালানি ও পণ্য সরবরাহ চেইন এবং প্রতিরক্ষা নীতিতে বাংলাদেশের জন্য সরাসরি বহুমুখী সংকট সৃষ্টি করেছে।',
          questionBreakdowns: [
            QuestionBreakdown(
              question: 'What is the Houthi–Saudi Conflict, and How Can It Limit a State?',
              anchorPoints: [
                '**The Definition:** The geopolitical clash involves Yemen\'s Iran-backed Houthi forces and Saudi Arabia. Under a strategy of asymmetric warfare, the Houthis use low-cost drones and ballistic missiles to target Saudi energy fields, airports, and global maritime chokepoints like the Bab el-Mandeb Strait.',
                '**The Incentive:** Saudi Arabia remains Bangladesh’s largest single source of foreign remittances and overseas employment. Dhaka relies on a peaceful Gulf region to maintain the stable employment of over 3.5 to 4 million migrant workers.',
                '**The Conflict:** Houthi targeting of civilian infrastructure severely disrupts these economic assumptions. The theater of war limits Bangladesh’s policy choices, forcing a traditionally neutral state to take explicit diplomatic and military stances.',
                '**The Precedent:** A devastating Houthi strike on Riyadh’s King Khalid International Airport in October 2026 directly killed two Bangladeshi nationals and injured 27 others, demonstrating that distant regional conflicts directly cost Bangladeshi lives.',
                '**The Takeaway:** A war confined to the Arabian Peninsula heavily restricts Bangladesh\'s domestic aviation, labor output, and economic planning.',
              ],
            ),
            QuestionBreakdown(
              question: 'Are Regional Security Standards Fair to Labor-Sustained States?',
              anchorPoints: [
                '**Asymmetric Labor Vulnerability:** The conflict places a massive physical burden on Bangladeshi migrants, who have no institutional protections from cross-border missile strikes while working in Saudi border zones and industrial hubs.',
                '**Flight and Visa Fears:** Escalating airport attacks cause mass aviation gridlock. In October 2026, flight cancellations grounded nearly 100 flights out of Dhaka, stranding over 15,000 passengers and threatening to invalidate strict Saudi work visas.',
                '**Extractive Sector Risks:** Saudi Arabia is a key supplier of crude fuel and fertilizer to Bangladesh. Houthi blockades and refinery strikes directly imperil the primary inputs needed to sustain Bangladeshi agriculture and industries.',
                '**Uneven Enforcement:** While global powers focus on broader geopolitical leverage, developing nations like Bangladesh absorb severe, uncompensated shocks to their migrant labor markets.',
                '**Limited Payoff:** Despite massive defense spending, conventional military forces have struggled to neutralize the Houthi threat, leaving foreign laborers exposed to prolonged, volatile security risks.',
              ],
            ),
            QuestionBreakdown(
              question: 'Why Does Bangladesh Keep its Remittance Sector Out of Geopolitical Shocks?',
              anchorPoints: [
                '**Unequal Economic Rights:** Unlike international corporations that can insure their assets against war, Bangladeshi workers often borrow heavily to finance migration. If local projects stall due to Saudi economic contraction, these laborers face bankruptcy without recourse.',
                '**Remittance Volatility:** Inflows from Saudi Arabia reached \$5.85 billion in the 2025–26 fiscal year, making up roughly a fifth of Bangladesh\'s total remittance basket. Regional conflict threatens this vital source of foreign currency reserves.',
              ],
            ),
            QuestionBreakdown(
              question: 'What Do Maritime Models Show About Settling Transit and Supply Chain Disputes?',
              anchorPoints: [
                '**Rerouting Realities:** To evade Houthi blockades, shipping vessels are forced to avoid the Suez Canal route. For instance, the Bangladesh Shipping Corporation\'s crude-oil tanker MT Ninemia had to detour around the Cape of Good Hope, ballooning a standard 15-day voyage from Saudi Arabia into a 50-day transit.',
                '**The Financial Impact:** This single rerouted voyage cost an extra Tk 66.63 crore. Multiply this across all imports, and the model shows massive inflationary pressure on landed fuel costs.',
                '**Export Strain:** For the Readymade Garment (RMG) sector, ocean container shipping rates to Europe more than doubled. While many buyers handle freight under free-on-board (FOB) terms, systemic supply delays hamper working capital.',
              ],
            ),
            QuestionBreakdown(
              question: 'How Can Bangladesh Secure Its Trade Without Getting Mired in War?',
              anchorPoints: [
                '**Multinational Security Cooperation:** In late mid-2026, Bangladesh officially joined the Multinational Maritime Defence Coalition (MMDC)—a Saudi-led 14-nation alliance designed to protect trade lanes in the Red Sea and Gulf of Aden.',
                '**Strategic Balancing:** Joining the MMDC marks Dhaka\'s first formal entry into a military defense alliance. To avoid diplomatic blowback, Bangladesh frames its inclusion purely as a defensive move to protect global commerce rather than an offensive step against Iran.',
                '**Equal Protection:** While aligning with Saudi security goals, Dhaka maintains separate communication channels with Tehran to isolate its economic trade interests from wider proxy warfare.',
              ],
            ),
          ],
          challenges: [
            'Award and Inflation Exposure: The conflict contributes to global oil price spikes, with IMF projections pushing crude averages to \$96 per barrel, placing an enormous financial burden on Bangladesh’s state treasury.',
            'Gaps in Labor Safety: Security lockdowns at airports inside the Kingdom leave thousands of arriving workers temporarily displaced, creating severe bottlenecks at Hazrat Shahjalal International Airport.',
            'Geopolitical Risks: Deepening military alignment with Riyadh runs the long-term risk of making Bangladeshi assets or personnel a secondary target for Houthi retaliatory threats.',
          ],
          wayForward: [
            'Diversify Overseas Labor: The Bureau of Manpower, Employment and Training should aggressively explore non-Middle Eastern markets to reduce the 60–80% peak employment dependency on Saudi Arabia.',
            'Strategic Fuel Reserves: Expand domestic fuel storage infrastructure to cushion against sudden shipping disruptions at the Bab el-Mandeb and Hormuz straits.',
            'Consular Contingency Frameworks: Embed rapid-response legal and emergency teams within the Bangladesh Embassy in Riyadh to support workers affected by corporate slowdowns or physical strikes.',
          ],
          governmentInitiatives: [
            'Formal Diplomatic Condemnation: The Ministry of Foreign Affairs issued a definitive statement condemning Houthi strikes on Saudi civilian targets, categorizing them as violations of international law.',
            'Founding Member of the MMDC: Bangladesh signed on as a founding partner of the Multinational Maritime Defence Coalition in August 2026, integrating military personnel into its joint operations and intelligence structures.',
            'Aviation Crisis Management: The Civil Aviation Authority of Bangladesh (CCAB) established emergency protocols at Dhaka airport to handle rescheduled worker transit following regional airspace closures.',
          ],
          conclusion: 'Bangladesh is trading its historical policy of absolute military neutrality for a strategic maritime alignment to preserve the economic lifelines of remittance and trade. What to watch moving forward is whether the newly formed 14-nation coalition can successfully pacify the Red Sea shipping lanes or if the lingering asymmetric war will continue to drive up domestic inflation in Dhaka.',
          dataStats: [],
          constitutionalArticles: [],
          analyticalBreakdownBn: 'রেমিট্যান্স ও আন্তর্জাতিক বাণিজ্যের অর্থনৈতিক জীবনরেখা সচল রাখতে বাংলাদেশ তার ঐতিহাসিক নিরপেক্ষতার অবস্থান থেকে সরে এসে কৌশলগত সামুদ্রিক জোটে যুক্ত হচ্ছে। এখন দেখার বিষয়, ১৪ জাতির নবগঠিত এই জোট লোহিত সাগরের নৌপথ কতটা নিরাপদ করতে পারে।',
          analyticalBreakdownEn: 'Bangladesh is trading its historical policy of absolute military neutrality for a strategic maritime alignment to preserve the economic lifelines of remittance and trade. What to watch moving forward is whether the newly formed 14-nation coalition can successfully pacify the Red Sea shipping lanes or if the lingering asymmetric war will continue to drive up domestic inflation in Dhaka.',
          writtenExamPrompt: WrittenExamPrompt(
            marks: 15,
            promptTextBn: 'প্রশ্ন: মধ্যপ্রাচ্যের ভূরাজনৈতিক অস্থিরতা ও লোহিত সাগরের নৌপথ সংকট বাংলাদেশের অর্থনীতি এবং শ্রমবাজারকে কীভাবে প্রভাবিত করছে? কৌশলগত নিরপেক্ষতা বজায় রেখে সমুদ্র বাণিজ্য ও অভিবাসী শ্রমিক সুরক্ষায় কার্যকর পদক্ষেপ আলোচনা করুন।',
            promptTextEn: 'Core Strategic Query: "Trading Neutrality for Maritime Security: Analyze the labor, supply-chain, and geopolitical risks confronting Bangladesh in the Houthi-Saudi theater, and evaluate the strategic viability of MMDC participation."',
            modelOutlinePoints: [
              '1. Labor & Aviation Exposure: Missile strikes on civilian transit hubs and the vulnerability of 4M overseas workers.',
              '2. Macroeconomic Surcharges: Cape of Good Hope detours, Tk 66.63 Cr tanker penalties, and RMG cost inflation.',
              '3. MMDC Defense Alignment: Balancing 14-nation maritime defense escort while maintaining bilateral diplomacy with Tehran.',
            ],
          ),
          linkedPyqs: [
            PyqReference(
              pyqId: 'affair_ref_houthi',
              bcsBatch: 'Geopolitical Strategy',
              subject: 'International Relations & Trade',
              questionSnippet: 'Geostrategic vulnerability of maritime chokepoints and economic fallout for remittance-dependent developing nations.',
              relevanceScore: 0.99,
            ),
          ],
        ),
      ),
    ];
  }

  /// Deduplicates stories across runs/sources and merges sources into a unified story card
  static List<CapsuleStory> _deduplicateStories(List<CapsuleStory> stories) {
    if (stories.isEmpty) return stories;

    final List<CapsuleStory> deduplicated = [];

    for (final story in stories) {
      final storyTokens = _extractSignificantTokens(story);
      int matchIndex = -1;

      for (int i = 0; i < deduplicated.length; i++) {
        final existing = deduplicated[i];
        final existingTokens = _extractSignificantTokens(existing);

        if (_areStoriesSameEvent(story, existing, storyTokens, existingTokens)) {
          matchIndex = i;
          break;
        }
      }

      if (matchIndex >= 0) {
        // Merge sources and tags into the existing story
        final existing = deduplicated[matchIndex];
        final mergedSources = List<Map<String, dynamic>>.from(existing.sources);
        final existingUrls = mergedSources
            .map((s) => (s['url'] ?? '').toString().trim().toLowerCase())
            .where((u) => u.isNotEmpty)
            .toSet();
        final existingNames = mergedSources
            .map((s) => (s['name'] ?? '').toString().trim().toLowerCase())
            .where((n) => n.isNotEmpty)
            .toSet();

        for (final src in story.sources) {
          final url = (src['url'] ?? '').toString().trim().toLowerCase();
          final name = (src['name'] ?? '').toString().trim().toLowerCase();
          final hasUrl = url.isNotEmpty && existingUrls.contains(url);
          final hasName = name.isNotEmpty && existingNames.contains(name);
          if (!hasUrl && !hasName) {
            mergedSources.add(src);
            if (url.isNotEmpty) existingUrls.add(url);
            if (name.isNotEmpty) existingNames.add(name);
          }
        }

        final mergedTags = {...existing.tags, ...story.tags}.toList();

        // Overwrite existing with enriched version
        deduplicated[matchIndex] = CapsuleStory(
          storyId: existing.storyId,
          primaryCategory: existing.primaryCategory,
          interestCategories: existing.interestCategories,
          tags: mergedTags,
          imageUrl: existing.imageUrl.isNotEmpty ? existing.imageUrl : story.imageUrl,
          imageCaption: existing.imageCaption.isNotEmpty ? existing.imageCaption : story.imageCaption,
          publishedAt: existing.publishedAt.isNotEmpty ? existing.publishedAt : story.publishedAt,
          isBcsProSelected: existing.isBcsProSelected || story.isBcsProSelected,
          importanceScore: math.max(existing.importanceScore, story.importanceScore),
          rankScore: math.max(existing.rankScore, story.rankScore),
          sources: mergedSources,
          dailyBuzz: existing.dailyBuzz,
          bcsPro: existing.bcsPro ?? story.bcsPro,
        );
      } else {
        deduplicated.add(story);
      }
    }

    // Dynamic Time-Decayed Ranking on Client using Device Clock
    // RankScore = Importance / (AgeInHours + 2.0) ^ 1.3
    final now = DateTime.now();
    deduplicated.sort((a, b) {
      final scoreA = a.calculateLiveRankScore(now);
      final scoreB = b.calculateLiveRankScore(now);
      return scoreB.compareTo(scoreA);
    });

    return deduplicated;
  }

  static bool _areStoriesSameEvent(
    CapsuleStory a,
    CapsuleStory b,
    Set<String> aTokens,
    Set<String> bTokens,
  ) {
    if (a.storyId == b.storyId) return true;

    // Check specific high-signal entity combos
    bool hasTariqueJapan(Set<String> t) =>
        (t.contains('tarique') || t.contains('তারেক') || t.contains('রহমান')) &&
        (t.contains('japan') || t.contains('জাপান'));

    bool hasIshraque(Set<String> t) =>
        (t.contains('ishraque') || t.contains('ইশরাক')) &&
        (t.contains('resignation') || t.contains('পদত্যাগ') || t.contains('পদ') || t.contains('bnp') || t.contains('বিএনপি'));

    bool hasHegsethIsrael(Set<String> t) =>
        (t.contains('hegseth') || t.contains('হেগসেথ')) &&
        (t.contains('israel') || t.contains('ইসরায়েল') || t.contains('ইসরাইল'));

    if (hasTariqueJapan(aTokens) && hasTariqueJapan(bTokens)) return true;
    if (hasIshraque(aTokens) && hasIshraque(bTokens)) return true;
    if (hasHegsethIsrael(aTokens) && hasHegsethIsrael(bTokens)) return true;

    // Shared high-signal token intersection
    if (aTokens.isNotEmpty && bTokens.isNotEmpty) {
      final intersection = aTokens.intersection(bTokens);
      final union = aTokens.union(bTokens);

      if (union.isNotEmpty) {
        final jaccard = intersection.length / union.length;
        if (jaccard >= 0.40) return true;
      }

      // If at least 3 significant tokens match (e.g., proper nouns)
      if (intersection.length >= 3) return true;
    }

    return false;
  }

  static Set<String> _extractSignificantTokens(CapsuleStory story) {
    final combined = '${story.dailyBuzz.titleEn} ${story.dailyBuzz.titleBn} ${story.tags.join(' ')}'
        .toLowerCase()
        .replaceAll(RegExp(r'[^\w\s\u0980-\u09FF]'), ' ');

    final stopWords = {
      'the', 'is', 'at', 'which', 'on', 'in', 'and', 'or', 'to', 'a', 'an', 'of',
      'for', 'with', 'as', 'by', 'from', 'this', 'that', 'are', 'was', 'were',
      'এবং', 'ও', 'বা', 'এ', 'এর', 'থেকে', 'কে', 'হবে', 'হয়েছে', 'করা', 'হয়', 'করে',
      'news', 'daily', 'dorpon', 'bangladesh', 'breaking', 'update', 'latest'
    };

    final tokens = combined
        .split(RegExp(r'\s+'))
        .map((t) => t.trim())
        .where((t) => t.length > 2 && !stopWords.contains(t))
        .toSet();

    return tokens;
  }
}
