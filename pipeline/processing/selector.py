from typing import List, Tuple
from pipeline.processing.deduplicator import ClusteredEvent
from pipeline.config import INTEREST_CATEGORIES

def select_stories_for_audiences(
    clusters: List[ClusteredEvent],
    bcs_limit: int = 4,
    total_pool_limit: int = 8
) -> Tuple[List[ClusteredEvent], List[ClusteredEvent]]:
    """
    Decides story allocation:
    1. BCS Pro Preset: Exactly 3 to 5 high-yield stories mapped to BPSC syllabus pillars.
    2. Daily Buzz Pool: A balanced pool of 8 to 10 stories across all interest categories.
    """
    # 1. Select BCS Pro Preset (Top scoring events with topic diversity)
    bcs_selected: List[ClusteredEvent] = []
    seen_categories = set()
    
    # Priority 1: High BCS score with category diversity
    for cluster in clusters:
        if cluster.bcs_score >= 2.0:
            cat_key = cluster.matched_categories[0] if cluster.matched_categories else "general"
            if cat_key not in seen_categories:
                bcs_selected.append(cluster)
                seen_categories.add(cat_key)
                if len(bcs_selected) >= bcs_limit:
                    break
                    
    # If not enough diverse stories, fill up to bcs_limit by score
    if len(bcs_selected) < bcs_limit:
        for cluster in clusters:
            if cluster not in bcs_selected:
                bcs_selected.append(cluster)
                if len(bcs_selected) >= bcs_limit:
                    break

    # 2. Daily Buzz Category Pool: Ensure balanced coverage across user interests
    pool_selected: List[ClusteredEvent] = list(bcs_selected)
    
    for cat_id in INTEREST_CATEGORIES.keys():
        if len(pool_selected) >= total_pool_limit:
            break
        # Find best story for this category
        for cluster in clusters:
            if cluster not in pool_selected and cat_id in cluster.matched_categories:
                pool_selected.append(cluster)
                break
                
    # Fill remaining slots up to total_pool_limit
    for cluster in clusters:
        if len(pool_selected) >= total_pool_limit:
            break
        if cluster not in pool_selected:
            pool_selected.append(cluster)
            
    return bcs_selected, pool_selected

def filter_feed_for_user_interests(
    stories: list,
    user_interests: List[str],
    limit: int = 5
) -> list:
    """
    Runtime filter for the Mobile App:
    Returns the best stories matching the user's selected interest tracks.
    If user_interests is empty, returns the default top 5 editor highlights.
    """
    if not user_interests:
        return stories[:limit]
        
    scored_stories = []
    for s in stories:
        # Check overlap
        matched = set(s.interest_categories).intersection(set(user_interests))
        match_count = len(matched)
        scored_stories.append((match_count, s))
        
    # Sort by match count descending, then original order
    scored_stories.sort(key=lambda x: x[0], reverse=True)
    return [s for _, s in scored_stories[:limit]]
