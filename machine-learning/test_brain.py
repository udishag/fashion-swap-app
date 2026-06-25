from run_feed import generate_live_feed

def test_tier_filtering():
    # Walmart user without premium: budget items should dominate top 3
    feed = generate_live_feed('walmart', False)
    top3_brands = feed.head(3)['item_brand'].tolist()
    budget = {'walmart', 'shein', 'h&m', 'pre-owned/thrifted'}
    assert any(b in budget for b in top3_brands), f"Expected budget brands in top 3, got {top3_brands}"

def test_premium_unlocks_higher_tier():
    feed_no = generate_live_feed('walmart', False)
    feed_yes = generate_live_feed('walmart', True)
    # Average score of premium items should be higher with unlock
    premium_brands = {'aritzia', 'lululemon', 'zara', 'urban outfitters'}
    score_no = feed_no[feed_no['item_brand'].isin(premium_brands)]['match_score'].mean()
    score_yes = feed_yes[feed_yes['item_brand'].isin(premium_brands)]['match_score'].mean()
    assert score_yes > score_no, "Premium unlock should boost tier-3 scores"

if __name__ == '__main__':
    test_tier_filtering()
    test_premium_unlocks_higher_tier()
    print("All tests passed!")