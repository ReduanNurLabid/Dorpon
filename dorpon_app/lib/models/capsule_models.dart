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
  final String whyItMattersBn;
  final String whyItMattersEn;
  final List<String> interestCategories;
  final int readTimeSeconds;

  DailyBuzzItem({
    required this.titleBn,
    required this.titleEn,
    required this.summaryBn,
    required this.summaryEn,
    required this.whyItMattersBn,
    required this.whyItMattersEn,
    required this.interestCategories,
    required this.readTimeSeconds,
  });

  factory DailyBuzzItem.fromJson(Map<String, dynamic> json) {
    return DailyBuzzItem(
      titleBn: json['title_bn'] ?? json['titleBn'] ?? '',
      titleEn: json['title_en'] ?? json['titleEn'] ?? '',
      summaryBn: json['summary_bn'] ?? json['summaryBn'] ?? '',
      summaryEn: json['summary_en'] ?? json['summaryEn'] ?? '',
      whyItMattersBn: json['why_it_matters_bn'] ?? json['whyItMattersBn'] ?? '',
      whyItMattersEn: json['why_it_matters_en'] ?? json['whyItMattersEn'] ?? '',
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
    required this.sources,
    required this.dailyBuzz,
    this.bcsPro,
  });

  String get formattedPublishedTime {
    if (publishedAt.isEmpty) return 'Recent';
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
      final timeStr = '$hour12:$minute $period';

      if (diff.isNegative || diff.inMinutes < 2) {
        return '$timeStr (Just now)';
      } else if (diff.inMinutes < 60) {
        return '$timeStr (${diff.inMinutes}m ago)';
      } else if (diff.inHours < 24) {
        return '$timeStr (${diff.inHours}h ago)';
      } else {
        return '${localDt.day}/${localDt.month} $timeStr';
      }
    } catch (_) {
      return publishedAt;
    }
  }

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
