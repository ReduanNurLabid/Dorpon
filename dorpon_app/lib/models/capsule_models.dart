import 'dart:math' as math;

/// Converts standard 0-9 digits to Bengali numerals ০-৯
String toBanglaDigits(dynamic input) {
  if (input == null) return '';
  const english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bangla = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  String text = input.toString();
  for (int i = 0; i < english.length; i++) {
    text = text.replaceAll(english[i], bangla[i]);
  }
  return text;
}

/// Strips raw newspaper relative day names and temporal leakage (e.g. সোমবার, গতকাল)
String stripRelativeDayLeakage(String text) {
  if (text.isEmpty) return '';
  final p1 = RegExp(r'(?:গতকাল\s+)?(?:গত\s+)?(?:সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্রবার|শনিবার|রবিবার)(?:\s+(?:সকালে|দুপুরে|বিকেলে|সন্ধ্যায়|রাতে))?\s*[,।]?\s*');
  final p2 = RegExp(r'(?:গতকাল|গত পরশু|আজকে|আজ)\s*[,।]?\s*');
  final p3 = RegExp(r'\b(?:on\s+)?(?:last\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+(?:morning|afternoon|evening|night))?\s*,\s*', caseSensitive: false);
  final p4 = RegExp(r'\b(?:yesterday|earlier today)\s*,\s*', caseSensitive: false);
  return text
      .replaceAll(p1, '')
      .replaceAll(p2, '')
      .replaceAll(p3, '')
      .replaceAll(p4, '')
      .replaceAll(RegExp(r'^[,।\-\–\s]+'), '')
      .trim();
}

/// Returns clean localized name for any category slug
String getLocalizedCategory(String cat, bool isBangla) {
  final clean = cat.toLowerCase().replaceAll(' ', '_');
  if (isBangla) {
    switch (clean) {
      case 'macroeconomy_banking':
      case 'economy_business':
      case 'economy':
      case 'macroeconomy':
        return 'অর্থনীতি ও বাণিজ্য';
      case 'governance_law':
      case 'governance':
      case 'law':
        return 'শাসন ও আইন';
      case 'climate_delta':
      case 'environment':
      case 'climate_environment':
        return 'জলবায়ু ও পরিবেশ';
      case 'international_diplomacy':
      case 'world_diplomacy':
      case 'diplomacy':
      case 'geopolitics':
      case 'trade_forex':
        return 'আন্তর্জাতিক কূটনীতি';
      case 'tech_infrastructure':
      case 'tech_innovation':
      case 'technology':
        return 'প্রযুক্তি ও উদ্ভাবন';
      case 'sports_fitness':
      case 'sports':
        return 'খেলাধুলা';
      case 'pop_culture':
      case 'culture':
        return 'সংস্কৃতি ও বিনোদন';
      default:
        return 'চলতি ঘটনাবলী';
    }
  } else {
    switch (clean) {
      case 'macroeconomy_banking':
      case 'economy_business':
      case 'economy':
      case 'macroeconomy':
        return 'Economy & Business';
      case 'governance_law':
      case 'governance':
      case 'law':
        return 'Governance & Law';
      case 'climate_delta':
      case 'environment':
      case 'climate_environment':
        return 'Climate & Environment';
      case 'international_diplomacy':
      case 'world_diplomacy':
      case 'diplomacy':
      case 'geopolitics':
      case 'trade_forex':
        return 'Global Diplomacy';
      case 'tech_infrastructure':
      case 'tech_innovation':
      case 'technology':
        return 'Tech & Innovation';
      case 'sports_fitness':
      case 'sports':
        return 'Sports';
      case 'pop_culture':
      case 'culture':
        return 'Culture & Entertainment';
      default:
        return 'Current Affairs';
    }
  }
}

class StatPoint {
  final String metricName;
  final String value;
  final String sourceOrg;
  final String context;

  StatPoint({
    required this.metricName,
    required this.value,
    required this.sourceOrg,
    required this.context,
  });

  factory StatPoint.fromJson(Map<String, dynamic> json) {
    return StatPoint(
      metricName: json['metric_name'] ?? '',
      value: json['value'] ?? '',
      sourceOrg: json['source_org'] ?? '',
      context: json['context'] ?? '',
    );
  }
}

class ConstitutionalCitation {
  final String articleNumber;
  final String articleTitleBn;
  final String articleTitleEn;
  final String legalRelevance;

  ConstitutionalCitation({
    required this.articleNumber,
    required this.articleTitleBn,
    required this.articleTitleEn,
    required this.legalRelevance,
  });

  factory ConstitutionalCitation.fromJson(Map<String, dynamic> json) {
    return ConstitutionalCitation(
      articleNumber: json['article_number'] ?? '',
      articleTitleBn: json['article_title_bn'] ?? '',
      articleTitleEn: json['article_title_en'] ?? '',
      legalRelevance: json['legal_relevance'] ?? '',
    );
  }
}

class WrittenExamPrompt {
  final int marks;
  final String promptTextBn;
  final String promptTextEn;
  final List<String> modelOutlinePoints;

  WrittenExamPrompt({
    required this.marks,
    required this.promptTextBn,
    required this.promptTextEn,
    required this.modelOutlinePoints,
  });

  factory WrittenExamPrompt.fromJson(Map<String, dynamic> json) {
    return WrittenExamPrompt(
      marks: json['marks'] ?? 15,
      promptTextBn: json['prompt_text_bn'] ?? '',
      promptTextEn: json['prompt_text_en'] ?? '',
      modelOutlinePoints: List<String>.from(json['model_outline_points'] ?? []),
    );
  }
}

class PyqReference {
  final String pyqId;
  final String bcsBatch;
  final String subject;
  final String questionSnippet;
  final double relevanceScore;

  PyqReference({
    required this.pyqId,
    required this.bcsBatch,
    required this.subject,
    required this.questionSnippet,
    required this.relevanceScore,
  });

  factory PyqReference.fromJson(Map<String, dynamic> json) {
    return PyqReference(
      pyqId: json['pyq_id'] ?? '',
      bcsBatch: json['bcs_batch'] ?? '',
      subject: json['subject'] ?? '',
      questionSnippet: json['question_snippet'] ?? '',
      relevanceScore: (json['relevance_score'] as num?)?.toDouble() ?? 0.9,
    );
  }
}

class SyllabusMapping {
  final String paperCode;
  final String subject;
  final String microtheme;
  final String fullBreadcrumb;

  SyllabusMapping({
    required this.paperCode,
    required this.subject,
    required this.microtheme,
    required this.fullBreadcrumb,
  });

  factory SyllabusMapping.fromJson(Map<String, dynamic> json) {
    String rawCode = json['paper_code'] ?? '';
    String rawSubject = json['subject'] ?? '';
    String rawTheme = json['microtheme'] ?? '';
    String rawBreadcrumb = json['full_breadcrumb'] ?? '';

    // Sanitize any legacy "Paper V / Paper VI / BCS Written" text from Firebase documents
    String cleanCode = rawCode.replaceAll(RegExp(r'Paper\s+[IVXLCDM]+', caseSensitive: false), 'Issue Track').trim();
    if (cleanCode.isEmpty) cleanCode = 'Issue Track';

    String cleanTheme = rawTheme.replaceAll(RegExp(r'Paper\s+[IVXLCDM]+', caseSensitive: false), '').trim();
    if (cleanTheme.startsWith('(') && cleanTheme.endsWith(')')) {
      cleanTheme = cleanTheme.substring(1, cleanTheme.length - 1).trim();
    }
    if (cleanTheme.isEmpty) cleanTheme = rawSubject.isNotEmpty ? rawSubject : 'Global & National Affairs';

    String cleanBreadcrumb = rawBreadcrumb
        .replaceAll(RegExp(r'\(Paper\s+[IVXLCDM]+\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'Paper\s+[IVXLCDM]+', caseSensitive: false), '')
        .trim();

    return SyllabusMapping(
      paperCode: cleanCode,
      subject: rawSubject,
      microtheme: cleanTheme,
      fullBreadcrumb: cleanBreadcrumb.isNotEmpty ? cleanBreadcrumb : cleanTheme,
    );
  }
}

class QuestionBreakdown {
  final String question;
  final List<String> anchorPoints;

  QuestionBreakdown({
    required this.question,
    required this.anchorPoints,
  });

  factory QuestionBreakdown.fromJson(Map<String, dynamic> json) {
    return QuestionBreakdown(
      question: json['question'] ?? '',
      anchorPoints: List<String>.from(json['anchor_points'] ?? []),
    );
  }
}

class DailyBuzzItem {
  final String titleBn;
  final String titleEn;
  final String summaryBn;
  final String summaryEn;
  final String leadBn;
  final String leadEn;
  final List<String> bulletsBn;
  final List<String> bulletsEn;
  final String detailsBn;
  final String detailsEn;
  final String impactBn;
  final String impactEn;
  final String whyItMattersBn;
  final String whyItMattersEn;
  final List<String> interestCategories;
  final int readTimeSeconds;

  DailyBuzzItem({
    required this.titleBn,
    required this.titleEn,
    required this.summaryBn,
    required this.summaryEn,
    this.leadBn = '',
    this.leadEn = '',
    this.bulletsBn = const [],
    this.bulletsEn = const [],
    this.detailsBn = '',
    this.detailsEn = '',
    this.impactBn = '',
    this.impactEn = '',
    required this.whyItMattersBn,
    required this.whyItMattersEn,
    required this.interestCategories,
    required this.readTimeSeconds,
  });

  static List<String> _ensureThreeBullets({
    required List<String> existingBullets,
    required String summary,
    required String lead,
    required String takeaway,
    required bool isBangla,
  }) {
    if (existingBullets.length >= 3) {
      return existingBullets.take(3).toList();
    }

    final result = List<String>.from(existingBullets);
    final seen = result.map((e) => e.toLowerCase()).toSet();

    final rawSentences = summary
        .split(RegExp(r'(?<=[.!?।])\s+'))
        .map((s) => s.replaceAll(RegExp(r'^[•\-\*\d\.]+\s*'), '').trim())
        .where((s) => s.length > 15)
        .toList();

    for (final s in rawSentences) {
      if (result.length >= 3) break;
      if (!seen.contains(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        result.add(s);
      }
    }

    if (result.length < 3 && takeaway.trim().isNotEmpty) {
      final t = takeaway.replaceAll(RegExp(r'^[•\-\*\d\.]+\s*'), '').trim();
      if (!seen.contains(t.toLowerCase())) {
        seen.add(t.toLowerCase());
        result.add(t);
      }
    }

    if (result.length < 3 && lead.trim().isNotEmpty) {
      final l = lead.replaceAll(RegExp(r'^[•\-\*\d\.]+\s*'), '').trim();
      if (!seen.contains(l.toLowerCase())) {
        seen.add(l.toLowerCase());
        result.add(l);
      }
    }

    if (result.length == 1) {
      result.add(isBangla
          ? 'সংশ্লিষ্ট কর্তৃপক্ষ ও অংশীজনেরা নির্বাহী প্রক্রিয়া সমন্বয় করছেন।'
          : 'Official representatives and stakeholders are monitoring developments.');
      result.add(isBangla
          ? 'পরবর্তী পদক্ষেপ দ্রুততম সময়ে কার্যকর করার নির্দেশ দেওয়া হয়েছে।'
          : 'Follow-up directives are expected following departmental review.');
    } else if (result.length == 2) {
      result.add(isBangla
          ? 'নীতিমালা ও আইনি প্রক্রিয়া অনুযায়ী পরবর্তী ব্যবস্থা গ্রহণ করা হবে।'
          : 'Immediate next steps follow established regulatory procedures.');
    }

    return result.take(3).toList();
  }

  factory DailyBuzzItem.fromJson(Map<String, dynamic> json) {
    final rawBulletsBn = json['bullets_bn'] ?? json['bulletsBn'] ?? json['key_takeaways_bn'];
    final rawBulletsEn = json['bullets_en'] ?? json['bulletsEn'] ?? json['key_takeaways_en'];
    List<String> parsedBulletsBn = [];
    if (rawBulletsBn is List) {
      parsedBulletsBn = rawBulletsBn
          .map((e) => stripRelativeDayLeakage(e.toString()))
          .where((e) => e.isNotEmpty)
          .toList();
    }
    List<String> parsedBulletsEn = [];
    if (rawBulletsEn is List) {
      parsedBulletsEn = rawBulletsEn
          .map((e) => stripRelativeDayLeakage(e.toString()))
          .where((e) => e.isNotEmpty)
          .toList();
    }

    final rawWimBn = stripRelativeDayLeakage((json['why_it_matters_bn'] ?? json['whyItMattersBn'] ?? '').toString());
    final rawWimEn = stripRelativeDayLeakage((json['why_it_matters_en'] ?? json['whyItMattersEn'] ?? '').toString());
    final rawSummaryBn = stripRelativeDayLeakage((json['summary_bn'] ?? json['summaryBn'] ?? '').toString());
    final rawSummaryEn = stripRelativeDayLeakage((json['summary_en'] ?? json['summaryEn'] ?? '').toString());
    final rawLeadBn = stripRelativeDayLeakage((json['lead_bn'] ?? json['leadBn'] ?? '').toString());
    final rawLeadEn = stripRelativeDayLeakage((json['lead_en'] ?? json['leadEn'] ?? '').toString());

    final finalizedBulletsBn = _ensureThreeBullets(
      existingBullets: parsedBulletsBn,
      summary: rawSummaryBn,
      lead: rawLeadBn,
      takeaway: rawWimBn,
      isBangla: true,
    );
    final finalizedBulletsEn = _ensureThreeBullets(
      existingBullets: parsedBulletsEn,
      summary: rawSummaryEn,
      lead: rawLeadEn,
      takeaway: rawWimEn,
      isBangla: false,
    );

    return DailyBuzzItem(
      titleBn: json['title_bn'] ?? json['titleBn'] ?? '',
      titleEn: json['title_en'] ?? json['titleEn'] ?? '',
      summaryBn: rawSummaryBn,
      summaryEn: rawSummaryEn,
      leadBn: rawLeadBn,
      leadEn: rawLeadEn,
      bulletsBn: finalizedBulletsBn,
      bulletsEn: finalizedBulletsEn,
      detailsBn: json['details_bn'] ?? json['detailsBn'] ?? '',
      detailsEn: json['details_en'] ?? json['detailsEn'] ?? '',
      impactBn: json['impact_bn'] ?? json['impactBn'] ?? '',
      impactEn: json['impact_en'] ?? json['impactEn'] ?? '',
      whyItMattersBn: rawWimBn,
      whyItMattersEn: rawWimEn,
      interestCategories: List<String>.from(json['interest_categories'] ?? json['interestCategories'] ?? []),
      readTimeSeconds: json['read_time_seconds'] ?? json['readTimeSeconds'] ?? 60,
    );
  }
}

class BcsProItem {
  final SyllabusMapping? syllabusMapping;
  final String bcsSubjectArea;
  final String whyInTheNewsBn;
  final String whyInTheNewsEn;
  final List<QuestionBreakdown> questionBreakdowns;
  final List<StatPoint> dataStats;
  final List<ConstitutionalCitation> constitutionalArticles;
  final List<String> challenges;
  final List<String> wayForward;
  final List<String> governmentInitiatives;
  final String conclusion;
  final String analyticalBreakdownBn;
  final String analyticalBreakdownEn;
  final WrittenExamPrompt? writtenExamPrompt;
  final List<PyqReference> linkedPyqs;

  BcsProItem({
    this.syllabusMapping,
    required this.bcsSubjectArea,
    required this.whyInTheNewsBn,
    required this.whyInTheNewsEn,
    required this.questionBreakdowns,
    required this.dataStats,
    required this.constitutionalArticles,
    required this.challenges,
    required this.wayForward,
    this.governmentInitiatives = const [],
    this.conclusion = '',
    required this.analyticalBreakdownBn,
    required this.analyticalBreakdownEn,
    this.writtenExamPrompt,
    required this.linkedPyqs,
  });

  factory BcsProItem.fromJson(Map<String, dynamic> json) {
    final rawGovInit = json['government_initiatives'];
    List<String> govList = [];
    if (rawGovInit is List && rawGovInit.isNotEmpty) {
      govList = List<String>.from(rawGovInit);
    } else if (json['constitutional_articles'] is List) {
      govList = (json['constitutional_articles'] as List).map((c) {
        if (c is Map) {
          final t = c['article_title_en'] ?? c['article_number'] ?? 'Policy';
          final r = c['legal_relevance'] ?? '';
          return '**$t:** $r';
        }
        return c.toString();
      }).toList();
    }

    return BcsProItem(
      syllabusMapping: json['syllabus_mapping'] != null
          ? SyllabusMapping.fromJson(json['syllabus_mapping'])
          : null,
      bcsSubjectArea: (json['bcs_subject_area'] as String? ?? 'National & Global Affairs')
          .replaceAll(RegExp(r'\(Paper\s+[IVXLCDM]+\)', caseSensitive: false), '')
          .replaceAll(RegExp(r'Paper\s+[IVXLCDM]+', caseSensitive: false), '')
          .trim(),
      whyInTheNewsBn: json['why_in_the_news_bn'] ?? '',
      whyInTheNewsEn: json['why_in_the_news_en'] ?? '',
      questionBreakdowns: (json['question_breakdowns'] as List? ?? [])
          .map((i) => QuestionBreakdown.fromJson(i))
          .toList(),
      dataStats: (json['data_stats'] as List? ?? [])
          .map((i) => StatPoint.fromJson(i))
          .toList(),
      constitutionalArticles: (json['constitutional_articles'] as List? ?? [])
          .map((i) => ConstitutionalCitation.fromJson(i))
          .toList(),
      challenges: List<String>.from(json['challenges'] ?? []),
      wayForward: List<String>.from(json['way_forward'] ?? []),
      governmentInitiatives: govList,
      conclusion: json['conclusion'] ?? json['analytical_breakdown_en'] ?? '',
      analyticalBreakdownBn: json['analytical_breakdown_bn'] ?? '',
      analyticalBreakdownEn: json['analytical_breakdown_en'] ?? '',
      writtenExamPrompt: json['written_exam_prompt'] != null
          ? WrittenExamPrompt.fromJson(json['written_exam_prompt'])
          : null,
      linkedPyqs: (json['linked_pyqs'] as List? ?? [])
          .map((i) => PyqReference.fromJson(i))
          .toList(),
    );
  }
}

class CapsuleStory {
  final String storyId;
  final String primaryCategory;
  final List<String> interestCategories;
  final List<String> tags;
  final String imageUrl;
  final String imageCaption;
  final String publishedAt;
  final bool isBcsProSelected;
  final double importanceScore;
  final double rankScore;
  final List<Map<String, dynamic>> sources;
  final DailyBuzzItem dailyBuzz;
  final BcsProItem? bcsPro;

  CapsuleStory({
    required this.storyId,
    required this.primaryCategory,
    required this.interestCategories,
    this.tags = const [],
    this.imageUrl = '',
    this.imageCaption = '',
    this.publishedAt = '',
    required this.isBcsProSelected,
    this.importanceScore = 2.0,
    this.rankScore = 1.0,
    required this.sources,
    required this.dailyBuzz,
    this.bcsPro,
  });

  /// Computes dynamic logarithmic-power time decay score against live device clock:
  /// RankScore = Importance / (AgeInHours + 2.0) ^ 1.3
  double calculateLiveRankScore(DateTime now) {
    double ageHours = 0.5;
    if (publishedAt.isNotEmpty) {
      final dt = DateTime.tryParse(publishedAt);
      if (dt != null) {
        final diff = now.difference(dt.toUtc()).inMinutes / 60.0;
        ageHours = diff < 0 ? 0.0 : diff;
      }
    }
    final decay = math.pow(ageHours + 2.0, 1.3);
    return importanceScore / decay;
  }

  String formattedPublishedTimeLocalized(bool isBangla) {
    if (publishedAt.isEmpty) return isBangla ? 'সম্প্রতি' : 'Recent';
    try {
      final dt = DateTime.tryParse(publishedAt);
      if (dt == null) {
        return publishedAt;
      }
      final localDt = dt.toLocal();
      final diff = DateTime.now().difference(localDt);
      
      final hour = localDt.hour;
      final minute = localDt.minute.toString().padLeft(2, '0');
      final period = hour >= 12 ? 'PM' : 'AM';
      final hour12 = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
      
      String timeStr;
      if (isBangla) {
        final hBn = toBanglaDigits(hour12);
        final mBn = toBanglaDigits(minute);
        timeStr = '$hBn:$mBn $period';
      } else {
        timeStr = '$hour12:$minute $period';
      }

      if (diff.isNegative || diff.inMinutes < 2) {
        return isBangla ? '$timeStr (এইমাত্র)' : '$timeStr (Just now)';
      } else if (diff.inMinutes < 60) {
        final mins = isBangla ? toBanglaDigits(diff.inMinutes) : '${diff.inMinutes}m';
        return isBangla ? '$timeStr ($mins মিনিট আগে)' : '$timeStr (${diff.inMinutes}m ago)';
      } else if (diff.inHours < 24) {
        final hours = isBangla ? toBanglaDigits(diff.inHours) : '${diff.inHours}h';
        return isBangla ? '$timeStr ($hours ঘণ্টা আগে)' : '$timeStr (${diff.inHours}h ago)';
      } else {
        if (isBangla) {
          const monthsBn = ['', 'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
          final mStr = localDt.month <= 12 ? monthsBn[localDt.month] : toBanglaDigits(localDt.month);
          final dStr = toBanglaDigits(localDt.day);
          return '$mStr $dStr • $timeStr';
        } else {
          const monthsEn = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          final mStr = localDt.month <= 12 ? monthsEn[localDt.month] : '${localDt.month}';
          return '$mStr ${localDt.day} • $timeStr';
        }
      }
    } catch (_) {
      return publishedAt;
    }
  }

  String get formattedPublishedTime => formattedPublishedTimeLocalized(false);

  factory CapsuleStory.fromJson(Map<String, dynamic> json) {
    List<String> parsedTags = [];
    if (json['tags'] != null && (json['tags'] as List).isNotEmpty) {
      parsedTags = List<String>.from(json['tags']);
    } else {
      final cats = (json['interest_categories'] as List? ?? ['Geopolitics', 'Trade', 'Security']);
      parsedTags = cats.map((e) {
        final str = e.toString().trim();
        return str.startsWith('#') ? str : '#${str.replaceAll('_', '')}';
      }).toList();
    }

    return CapsuleStory(
      storyId: json['story_id'] ?? '',
      primaryCategory: json['primary_category'] ?? '',
      interestCategories: List<String>.from(json['interest_categories'] ?? []),
      tags: parsedTags,
      imageUrl: json['image_url'] ?? json['imageUrl'] ?? '',
      imageCaption: json['image_caption'] ?? json['imageCaption'] ?? '',
      publishedAt: json['published_at'] ?? json['publishedAt'] ?? (json['daily_buzz'] is Map ? json['daily_buzz']['published_at'] : null) ?? json['created_at'] ?? '',
      isBcsProSelected: json['is_bcs_pro_selected'] ?? false,
      importanceScore: (json['importance_score'] as num?)?.toDouble() ?? 2.0,
      rankScore: (json['rank_score'] as num?)?.toDouble() ?? 1.0,
      sources: (json['sources'] as List? ?? [])
          .map((s) => Map<String, dynamic>.from(s is Map ? s : {'name': 'Source', 'url': ''}))
          .toList(),
      dailyBuzz: DailyBuzzItem.fromJson(json['daily_buzz'] ?? json['dailyBuzz'] ?? {}),
      bcsPro: (json['bcs_pro'] ?? json['bcsPro']) != null
          ? BcsProItem.fromJson(json['bcs_pro'] ?? json['bcsPro'])
          : null,
    );
  }
}

class DailyCapsule {
  final String editionDate;
  final String createdAt;
  final String status;
  final List<String> bcsProPresetStoryIds;
  final List<CapsuleStory> stories;
  final int totalStories;

  DailyCapsule({
    required this.editionDate,
    required this.createdAt,
    required this.status,
    required this.bcsProPresetStoryIds,
    required this.stories,
    required this.totalStories,
  });

  factory DailyCapsule.fromJson(Map<String, dynamic> json) {
    return DailyCapsule(
      editionDate: json['edition_date'] ?? '',
      createdAt: json['created_at'] ?? '',
      status: json['status'] ?? 'PENDING_REVIEW',
      bcsProPresetStoryIds: List<String>.from(json['bcs_pro_preset_story_ids'] ?? []),
      stories: (json['stories'] as List? ?? [])
          .map((i) => CapsuleStory.fromJson(i))
          .toList(),
      totalStories: json['total_stories'] ?? 0,
    );
  }
}
