"""
Monte Carlo Simulation with Connection Analysis for Mixed Pairs
Runs matching simulation, tracks actual pairs, analyzes synergy patterns
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib.lines import Line2D
import seaborn as sns
from collections import Counter, defaultdict
import random

# ============================================================================
# DATA DEFINITIONS
# ============================================================================

# 52 Interests
INTERESTS = [
    "cars", "gaming", "working_out", "photography", "cooking", "travel",
    "motorcycles", "hiking", "painting", "fitness", "reading", "writing",
    "yoga", "meditation", "mindfulness", "music", "spirituality", "gardening",
    "fashion", "technology", "movies", "running", "cycling", "investing",
    "architecture", "astronomy", "dancing", "fishing", "camping", "theater",
    "sports", "philosophy", "podcasts", "design", "baking", "crafts",
    "animals", "blogging", "anime", "history", "chess", "skateboarding",
    "programming", "volunteering", "woodworking", "languages", "makeup",
    "diy_projects", "journaling", "interior_design", "marine_biology",
    "entrepreneurship"
]

# 16 Archetypes with their interest vectors
PERSONAS = {
    "System Weaver": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    "Data Drifter": [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0],
    "Grid Captain": [1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    "Circuit Jumper": [1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    "Soul Cartographer": [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    "Dreamsmith": [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    "Pulse Guide": [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0],
    "Vibe Rider": [0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "Core Mason": [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    "Harbor Keeper": [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    "Forge Handler": [1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    "Thread Bonder": [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0],
    "Tinker Nomad": [1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0],
    "Inner Glider": [0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
    "Momentum Spark": [1, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    "Echo Prism": [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
}

# Ladder Bonuses
LADDER_BONUSES = [
    0.60, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.50,
    0.49, 0.48, 0.45, 0.43, 0.42, 0.41, 0.20, 0.05
]

# ============================================================================
# CORE MATCHING FUNCTIONS
# ============================================================================

def generate_random_user_interests(num_interests=5):
    """Generate random user by selecting interests"""
    indices = random.sample(range(52), num_interests)
    vector = [0] * 52
    for idx in indices:
        vector[idx] = 1
    return vector

def compute_alignment(user_vector, personas):
    """Compute alignment percentages for all archetypes"""
    user_ones = sum(user_vector)
    if user_ones == 0:
        return []

    scores = []
    for persona_name, persona_vector in personas.items():
        matches = sum(1 for i in range(52) if user_vector[i] == 1 and persona_vector[i] == 1)
        percentage = (matches / user_ones) * 100
        scores.append({
            'persona': persona_name,
            'percentage': round(percentage, 2)
        })

    scores.sort(key=lambda x: x['percentage'], reverse=True)
    return scores

def apply_ladder_bonus(alignment_scores):
    """Apply ladder bonuses to alignment scores"""
    weighted_scores = {}
    for idx, item in enumerate(alignment_scores):
        persona = item['persona']
        percentage = item['percentage']
        ladder = LADDER_BONUSES[idx] if idx < len(LADDER_BONUSES) else LADDER_BONUSES[-1]
        weighted_score = percentage * ladder
        weighted_scores[persona] = {
            'raw_percentage': percentage,
            'ladder_bonus': ladder,
            'weighted_score': weighted_score,
            'rank': idx + 1
        }
    return weighted_scores

def create_weighted_dice(sorted_personas, ladder_bonuses):
    """Create weighted probability distribution"""
    weighted = []
    for idx, persona_data in enumerate(sorted_personas):
        ladder = ladder_bonuses[idx] if idx < len(ladder_bonuses) else ladder_bonuses[-1]
        weighted_score = persona_data['percentage'] * ladder
        weighted.append({
            'persona': persona_data['persona'],
            'weightedScore': weighted_score
        })

    total = sum(w['weightedScore'] for w in weighted)

    if total == 0:
        inc = 100 / len(weighted)
        cumulative = 0
        dice = []
        for w in weighted:
            cumulative += inc
            dice.append({'persona': w['persona'], 'cumulativeMax': cumulative})
        return dice

    cumulative = 0
    dice = []
    for w in weighted:
        cumulative += (w['weightedScore'] / total) * 100
        dice.append({'persona': w['persona'], 'cumulativeMax': cumulative})

    return dice

def roll_weighted_dice(dice):
    """Select persona based on weighted probability"""
    r = random.random() * 100
    for w in dice:
        if r <= w['cumulativeMax']:
            return w['persona']
    return dice[0]['persona']

def run_matching_round(users):
    """Run one round of matching for all users"""
    selections = []

    for user_id, user_vector in users.items():
        alignments = compute_alignment(user_vector, PERSONAS)
        dice = create_weighted_dice(alignments, LADDER_BONUSES)
        selected_persona = roll_weighted_dice(dice)
        rank = next((i+1 for i, p in enumerate(alignments) if p['persona'] == selected_persona), 1)

        selections.append({
            'user_id': user_id,
            'user_vector': user_vector,
            'selected_persona': selected_persona,
            'rank': rank,
            'alignments': alignments
        })

    return selections

def pair_users(selections):
    """Pair users based on their selected personas"""
    persona_groups = defaultdict(list)
    for sel in selections:
        persona_groups[sel['selected_persona']].append(sel)

    matches = []
    remaining = []

    # Pair within same persona
    for persona, users in persona_groups.items():
        random.shuffle(users)
        while len(users) >= 2:
            u1 = users.pop()
            u2 = users.pop()
            matches.append({
                'user1': u1,
                'user2': u2,
                'match_type': 'same_persona',
                'persona': persona
            })
        remaining.extend(users)

    # Random fallback for remaining (MIXED PAIRS)
    if len(remaining) >= 2:
        random.shuffle(remaining)
        while len(remaining) >= 2:
            u1 = remaining.pop()
            u2 = remaining.pop()
            matches.append({
                'user1': u1,
                'user2': u2,
                'match_type': 'mixed',
                'persona': 'mixed'
            })

    return matches, remaining

# ============================================================================
# CONNECTION ANALYSIS FUNCTIONS (ASYMMETRY & CROSS-PATH SYNERGY ANALYZER)
# ============================================================================
def calculate_connection_strength(personA_weighted, personB_weighted, max_possible=60.0):
    """
    Calculate directional connection strengths between archetypes.
    Returns two dicts:
        - connections_AB: A → B
        - connections_BA: B → A
    Adds slight self-weighting to break perfect symmetry.
    """
    connections_AB = {}
    connections_BA = {}
    archetypes = list(PERSONAS.keys())

    for a in archetypes:
        for b in archetypes:
            a_to_b = (
                personA_weighted[a]["weighted_score"]
                * (0.8 * personB_weighted[b]["weighted_score"] + 0.2 * personA_weighted[a]["weighted_score"])
            ) / (max_possible ** 2)

            b_to_a = (
                personB_weighted[b]["weighted_score"]
                * (0.8 * personA_weighted[a]["weighted_score"] + 0.2 * personB_weighted[b]["weighted_score"])
            ) / (max_possible ** 2)

            if a_to_b > 0.01:
                connections_AB[(a, b)] = a_to_b
            if b_to_a > 0.01:
                connections_BA[(b, a)] = b_to_a

    return connections_AB, connections_BA

def calculate_synergy_score(connections_AB, connections_BA, lower_bound=0.01, upper_bound=1.0):
    """
    Detect both direct asymmetry and cross-path synergy between archetypes.
    Returns a synergy score and detailed diagnostics.
    """
    synergy_score = 0.0
    asymmetric_paths = []

    # Consider all connections above a minimal "strong enough" threshold
    threshold_strong = 0.01
    strong_AB = {k: v for k, v in connections_AB.items() if v >= threshold_strong}
    strong_BA = {k: v for k, v in connections_BA.items() if v >= threshold_strong}

    # ---------- Direct asymmetry ----------
    for (a, b), strength_AB in strong_AB.items():
        strength_BA = connections_BA.get((b, a), 0.0)
        diff = strength_AB - strength_BA
        abs_diff = abs(diff)

        if lower_bound <= abs_diff <= upper_bound:
            asymmetric_paths.append({
                "A_to_B": f"{a} → {b}",
                "B_to_A": f"{b} → {a}",
                "gap_A_to_B": round(diff, 4),
                "gap_B_to_A": round(-diff, 4),
                "diagnostic": "Direct Asymmetry"
            })
            synergy_score += abs_diff

    # ---------- Cross-path asymmetry ----------
    for (a, b), strength_AB in strong_AB.items():
        for (b2, a2), strength_BA in strong_BA.items():
            if a != a2 and b != b2:
                gap = abs(strength_AB - strength_BA)
                if lower_bound <= gap <= upper_bound:
                    asymmetric_paths.append({
                        "A_to_B": f"{a} → {b}",
                        "B_to_A": f"{b2} → {a2}",
                        "gap_A_to_B": round(strength_AB, 4),
                        "gap_B_to_A": round(strength_BA, 4),
                        "diagnostic": "Cross-Path Synergy"
                    })
                    synergy_score += gap / 2

    return synergy_score, asymmetric_paths

def find_top_asym_pair(connections_AB, connections_BA):
    # Calculate all asymmetries
    _, asym_paths = calculate_synergy_score(connections_AB, connections_BA)

    if not asym_paths:
        return None, None

    # Sort by largest absolute gap in direct asymmetry first
    asym_paths.sort(key=lambda x: abs(x["gap_A_to_B"] - x["gap_B_to_A"]), reverse=True)

    # Pick the first one (largest asymmetry)
    top_asym = asym_paths[0]

    return top_asym


# ============================================================================
# MONTE CARLO SIMULATION
# ============================================================================

def run_simulation_with_connection_tracking(num_users=10000, num_rounds=10, num_simulations=20):
    """Run Monte Carlo simulation and track mixed pairs for connection analysis"""

    all_results = {
        'persona_selections': [],
        'rank_distributions': [],
        'match_patterns': [],
        'mixed_pairs': [],  # Track all mixed pairs
        'parameters': {
            'num_users': num_users,
            'num_rounds': num_rounds,
            'num_simulations': num_simulations,
            'total_events': num_users * num_rounds * num_simulations
        }
    }

    print(f"Running {num_simulations} simulations with {num_users} users...")

    for sim in range(num_simulations):
        if (sim + 1) % 5 == 0:
            print(f"  Completed {sim + 1}/{num_simulations} simulations...")

        # Generate users
        users = {f"User_{i}": generate_random_user_interests(5) for i in range(num_users)}

        simulation_data = {
            'persona_counts': Counter(),
            'rank_counts': Counter(),
            'match_types': Counter()
        }

        for round_num in range(num_rounds):
            selections = run_matching_round(users)
            matches, remaining = pair_users(selections)

            # Track selections
            for sel in selections:
                simulation_data['persona_counts'][sel['selected_persona']] += 1
                simulation_data['rank_counts'][sel['rank']] += 1

            # Track matches and collect mixed pairs
            for match in matches:
                simulation_data['match_types'][match['match_type']] += 1

                if match['match_type'] == 'mixed':
                    # Store mixed pair for connection analysis
                    all_results['mixed_pairs'].append({
                        'sim': sim,
                        'round': round_num,
                        'user1_id': match['user1']['user_id'],
                        'user1_vector': match['user1']['user_vector'],
                        'user1_alignments': match['user1']['alignments'],
                        'user2_id': match['user2']['user_id'],
                        'user2_vector': match['user2']['user_vector'],
                        'user2_alignments': match['user2']['alignments']
                    })

        all_results['persona_selections'].append(dict(simulation_data['persona_counts']))
        all_results['rank_distributions'].append(dict(simulation_data['rank_counts']))
        all_results['match_patterns'].append(dict(simulation_data['match_types']))

    print(f"Simulation complete! Found {len(all_results['mixed_pairs'])} mixed pairs.")
    return all_results

# ============================================================================
# VISUALIZATION FUNCTIONS
# ============================================================================

def plot_monte_carlo_results(results):
    """Create Monte Carlo statistical visualizations"""

    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Monte Carlo Simulation Results - Connection Analysis',
                fontsize=16, fontweight='bold')

    # 1. Persona Selection Distribution
    all_personas = []
    for sim_result in results['persona_selections']:
        for persona, count in sim_result.items():
            all_personas.extend([persona] * count)

    persona_counts = Counter(all_personas)
    personas_sorted = sorted(persona_counts.items(), key=lambda x: x[1], reverse=True)

    ax1 = axes[0, 0]
    ax1.barh([p[0] for p in personas_sorted], [p[1] for p in personas_sorted], color='steelblue')
    ax1.set_xlabel('Selection Count')
    ax1.set_title('Archetype Selection Frequency')
    ax1.grid(axis='x', alpha=0.3)

    # 2. Rank Distribution
    all_ranks = []
    for sim_result in results['rank_distributions']:
        for rank, count in sim_result.items():
            all_ranks.extend([rank] * count)

    ax2 = axes[0, 1]
    rank_counts = Counter(all_ranks)
    ranks = sorted(rank_counts.keys())
    counts = [rank_counts.get(r, 0) for r in ranks]
    ax2.bar(ranks, counts, color='coral')
    ax2.set_xlabel('Rank')
    ax2.set_ylabel('Frequency')
    ax2.set_title('Rank Selection Distribution')
    ax2.set_xticks(range(1, 17))
    ax2.grid(axis='y', alpha=0.3)

    # 3. Match Type Distribution
    all_match_types = []
    for sim_result in results['match_patterns']:
        for match_type, count in sim_result.items():
            all_match_types.extend([match_type] * count)

    match_counts = Counter(all_match_types)

    ax3 = axes[1, 0]
    match_types = list(match_counts.keys())
    match_values = [match_counts[mt] for mt in match_types]
    ax3.bar(match_types, match_values, color=['mediumseagreen', 'orange'])
    ax3.set_ylabel('Count')
    ax3.set_title('Match Type Distribution')
    ax3.grid(axis='y', alpha=0.3)

    # 4. Ladder Bonus Impact
    ax4 = axes[1, 1]
    ranks_list = list(range(1, 17))
    bonuses = LADDER_BONUSES
    frequencies = [rank_counts.get(r, 0) for r in ranks_list]

    ax4_twin = ax4.twinx()
    ax4.plot(ranks_list, bonuses, 'b-o', label='Ladder Bonus', linewidth=2)
    ax4_twin.bar(ranks_list, frequencies, alpha=0.3, color='orange', label='Selection Frequency')

    ax4.set_xlabel('Rank')
    ax4.set_ylabel('Ladder Bonus', color='b')
    ax4_twin.set_ylabel('Selection Frequency', color='orange')
    ax4.set_title('Ladder Bonus vs Selection Frequency')
    ax4.tick_params(axis='y', labelcolor='b')
    ax4_twin.tick_params(axis='y', labelcolor='orange')
    ax4.set_xticks(range(1, 17))
    ax4.grid(alpha=0.3)
    ax4.legend(loc='upper left')
    ax4_twin.legend(loc='upper right')

    plt.tight_layout()
    plt.show()

    return persona_counts, rank_counts, match_counts

def visualize_pair_connection(pair_data, title_prefix=""):
    """Create 3-chart visualization for a single pair"""

    # Compute weighted scores
    alignments_A = pair_data['user1_alignments']
    alignments_B = pair_data['user2_alignments']

    weighted_A = apply_ladder_bonus(alignments_A)
    weighted_B = apply_ladder_bonus(alignments_B)

    archetype_names = list(PERSONAS.keys())

    # Grid positions
    grid_positions = []
    for i in range(16):
        x = i % 4
        y = i // 4
        grid_positions.append([x, y])

    positions = np.array(grid_positions)

    # 3D coordinates
    x_coords_A = positions[:, 0] - 3
    y_coords_A = positions[:, 1]
    heights_A = np.array([weighted_A[name]['weighted_score'] for name in archetype_names])

    x_coords_B = positions[:, 0] + 3
    y_coords_B = positions[:, 1]
    heights_B = np.array([weighted_B[name]['weighted_score'] for name in archetype_names])

    # 2D coordinates
    x_coords_A_2d = positions[:, 0] - 2.5
    y_coords_A_2d = positions[:, 1]
    x_coords_B_2d = positions[:, 0] + 2.5
    y_coords_B_2d = positions[:, 1]

    # Calculate connections
    connections_AB, connections_BA = calculate_connection_strength(weighted_A, weighted_B)

    # ========================================================================
    # CHART 1: 3D Landscapes
    # ========================================================================
    fig1 = plt.figure(figsize=(18, 8))
    ax1 = fig1.add_subplot(111, projection='3d')

    ax1.scatter(x_coords_A, y_coords_A, heights_A,
               c='blue', s=200, alpha=0.8, edgecolors='black', linewidth=2,
               label='Person A')

    ax1.scatter(x_coords_B, y_coords_B, heights_B,
               c='red', s=200, alpha=0.8, edgecolors='black', linewidth=2,
               label='Person B')

    for idx in np.argsort(heights_A)[-5:]:
        ax1.text(x_coords_A[idx], y_coords_A[idx], heights_A[idx] + 2,
               archetype_names[idx][:10], fontsize=7, color='blue', fontweight='bold')

    for idx in np.argsort(heights_B)[-5:]:
        ax1.text(x_coords_B[idx], y_coords_B[idx], heights_B[idx] + 2,
               archetype_names[idx][:10], fontsize=7, color='red', fontweight='bold')

    ax1.set_xlabel('X Position')
    ax1.set_ylabel('Y Position')
    ax1.set_zlabel('Weighted Score')
    ax1.set_title(f'{title_prefix}3D Archetype Landscapes', fontsize=14, fontweight='bold', pad=20)
    ax1.legend(loc='upper left')
    ax1.view_init(elev=25, azim=45)

    plt.tight_layout()
    plt.show()

    # ========================================================================
    # CHART 2: A→B Network
    # ========================================================================
    fig2, ax2 = plt.subplots(figsize=(16, 10))

    # Draw connections
    synergy_score = 0
    synergy_examples = []

    for (arch_A, arch_B), strength_AB in connections_AB.items():
        strength_BA = connections_BA.get((arch_B, arch_A), 0.0)
        gap = strength_AB - strength_BA
        if abs(gap) > 0:  # count any difference, even small
            synergy_score += abs(gap)
            synergy_examples.append({
                "pathway_A_to_B": f"{arch_A} → {arch_B}",
                "pathway_B_to_A": f"{arch_B} → {arch_A}",
                "gap_A_to_B": round(gap, 4),
                "gap_B_to_A": round(-gap, 4),
                "diagnostic": "Detected Asymmetry"
            })


    # Plot dots
    sizes_A = heights_A * 20
    sizes_B = heights_B * 20

    ax2.scatter(x_coords_A_2d, y_coords_A_2d, s=sizes_A,
               c='blue', alpha=0.7, edgecolors='black', linewidth=2, zorder=3)
    ax2.scatter(x_coords_B_2d, y_coords_B_2d, s=sizes_B,
               c='red', alpha=0.7, edgecolors='black', linewidth=2, zorder=3)

    # Label top 5
    for idx in np.argsort(heights_A)[-5:]:
        ax2.annotate(archetype_names[idx][:8],
                    (x_coords_A_2d[idx], y_coords_A_2d[idx]),
                    xytext=(-30, 0), textcoords='offset points',
                    fontsize=8, color='blue', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7))

    for idx in np.argsort(heights_B)[-5:]:
        ax2.annotate(archetype_names[idx][:8],
                    (x_coords_B_2d[idx], y_coords_B_2d[idx]),
                    xytext=(30, 0), textcoords='offset points',
                    fontsize=8, color='red', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7))

    ax2.set_xlabel('Position', fontsize=12)
    ax2.set_ylabel('Position', fontsize=12)
    ax2.set_title(f'{title_prefix}Person A → Person B Attraction Network',
                 fontsize=14, fontweight='bold', pad=15)
    ax2.grid(True, alpha=0.3)
    ax2.set_aspect('equal')

    legend_elements = [
        Line2D([0], [0], marker='o', color='w', markerfacecolor='blue', markersize=10, label='Person A'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='red', markersize=10, label='Person B'),
        Line2D([0], [0], color='green', linewidth=3, alpha=0.6, label='A→B Attraction')
    ]
    ax2.legend(handles=legend_elements, loc='upper center', bbox_to_anchor=(0.5, -0.05), ncol=3)

    plt.tight_layout()
    plt.show()

    # ========================================================================
    # CHART 3: B→A Network
    # ========================================================================
    fig3, ax3 = plt.subplots(figsize=(16, 10))

    # Draw connections
    for (arch_B, arch_A), strength in connections_BA.items():
        idx_B = archetype_names.index(arch_B)
        idx_A = archetype_names.index(arch_A)
        ax3.plot([x_coords_B_2d[idx_B], x_coords_A_2d[idx_A]],
                [y_coords_B_2d[idx_B], y_coords_A_2d[idx_A]],
                color='orange', alpha=min(strength * 5, 0.8),
                linewidth=strength * 10, zorder=1)

    # Plot dots
    ax3.scatter(x_coords_B_2d, y_coords_B_2d, s=sizes_B,
               c='red', alpha=0.7, edgecolors='black', linewidth=2, zorder=3)
    ax3.scatter(x_coords_A_2d, y_coords_A_2d, s=sizes_A,
               c='blue', alpha=0.7, edgecolors='black', linewidth=2, zorder=3)

    # Label top 5
    for idx in np.argsort(heights_B)[-5:]:
        ax3.annotate(archetype_names[idx][:8],
                    (x_coords_B_2d[idx], y_coords_B_2d[idx]),
                    xytext=(30, 0), textcoords='offset points',
                    fontsize=8, color='red', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7))

    for idx in np.argsort(heights_A)[-5:]:
        ax3.annotate(archetype_names[idx][:8],
                    (x_coords_A_2d[idx], y_coords_A_2d[idx]),
                    xytext=(-30, 0), textcoords='offset points',
                    fontsize=8, color='blue', fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7))

    ax3.set_xlabel('Position', fontsize=12)
    ax3.set_ylabel('Position', fontsize=12)
    ax3.set_title(f'{title_prefix}Person B → Person A Attraction Network',
                 fontsize=14, fontweight='bold', pad=15)
    ax3.grid(True, alpha=0.3)
    ax3.set_aspect('equal')

    legend_elements2 = [
        Line2D([0], [0], marker='o', color='w', markerfacecolor='red', markersize=10, label='Person B'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='blue', markersize=10, label='Person A'),
        Line2D([0], [0], color='orange', linewidth=3, alpha=0.6, label='B→A Attraction')
    ]
    ax3.legend(handles=legend_elements2, loc='upper center', bbox_to_anchor=(0.5, -0.05), ncol=3)

    plt.tight_layout()
    plt.show()

    return connections_AB, connections_BA

def analyze_aggregate_connections(mixed_pairs, sample_size=100):
    """Analyze average connection patterns across mixed pairs"""

    print(f"\nAnalyzing aggregate patterns from {min(sample_size, len(mixed_pairs))} mixed pairs...")

    # Sample pairs for analysis
    sampled_pairs = random.sample(mixed_pairs, min(sample_size, len(mixed_pairs)))

    all_connections_AB = []
    all_connections_BA = []
    synergy_scores = []
    all_synergy_examples = []

    for pair in sampled_pairs:
        weighted_A = apply_ladder_bonus(pair['user1_alignments'])
        weighted_B = apply_ladder_bonus(pair['user2_alignments'])

        conn_AB, conn_BA = calculate_connection_strength(weighted_A, weighted_B)

        all_connections_AB.extend(list(conn_AB.values()))
        all_connections_BA.extend(list(conn_BA.values()))

        synergy, examples = calculate_synergy_score(conn_AB, conn_BA)
        synergy_scores.append(synergy)
        if examples:
            all_synergy_examples.extend(examples)

    # Calculate statistics
    avg_strength_AB = np.mean(all_connections_AB) if all_connections_AB else 0
    avg_strength_BA = np.mean(all_connections_BA) if all_connections_BA else 0
    avg_synergy = np.mean(synergy_scores) if synergy_scores else 0

    print(f"  Average A→B connection strength: {avg_strength_AB:.3f}")
    print(f"  Average B→A connection strength: {avg_strength_BA:.3f}")
    print(f"  Average synergy score: {avg_synergy:.3f}")
    print(f"  Total asymmetric pathways found: {len(all_synergy_examples)}")

    return {
        'avg_strength_AB': avg_strength_AB,
        'avg_strength_BA': avg_strength_BA,
        'avg_synergy': avg_synergy,
        'all_strengths_AB': all_connections_AB,
        'all_strengths_BA': all_connections_BA,
        'synergy_scores': synergy_scores,
        'synergy_examples': all_synergy_examples
    }

from dataclasses import dataclass

# ============================================================================
# CONFIGURATION DATACLASS
# ============================================================================

@dataclass
class SimulationConfig:
    num_users: int = 10000
    num_rounds: int = 10
    num_simulations: int = 20

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def print_header(title, width=70):
    print("\n" + "=" * width)
    print(title.upper())
    print("=" * width + "\n")

def get_simulation_config():
    print_header("MONTE CARLO SIMULATION WITH CONNECTION ANALYSIS")
    print("Recommended configurations:")
    print("  - Standard: 10000 users, 10 rounds, 20 simulations (2M events)")
    print("  - More rounds: 10000 users, 100 rounds, 20 simulations (20M events)")
    print("  - More users: 25000 users, 50 rounds, 20 simulations (25M events)")
    print("  - Maximum: 25000 users, 100 rounds, 20 simulations (50M events)\n")

    try:
        num_users = int(input("Enter number of users per simulation (e.g., 10000, 25000): ").replace(",", ""))
        num_rounds = int(input("Enter number of rounds per simulation (e.g., 10, 50, 100): ").replace(",", ""))
        num_simulations = int(input("Enter number of simulations to run (e.g., 20): ").replace(",", ""))
    except ValueError:
        print("Invalid input! Using default values: 10000 users, 10 rounds, 20 simulations")
        num_users, num_rounds, num_simulations = 10000, 10, 20

    print("\n" + "=" * 70)
    print(f"Configuration:")
    print(f"  - Users per simulation: {num_users:,}")
    print(f"  - Rounds per simulation: {num_rounds}")
    print(f"  - Total simulations: {num_simulations}")
    total_events = num_users * num_rounds * num_simulations
    print(f"  - Total matching events: {total_events:,}")
    print(f"  - Expected mixed pairs: ~{int(total_events * 0.0004)}")
    print("=" * 70 + "\n")

    return SimulationConfig(num_users, num_rounds, num_simulations)

def print_simulation_summary(results):
    params = results['parameters']
    print(f"\nSimulation Parameters:")
    print(f"  - Users per simulation: {params['num_users']:,}")
    print(f"  - Rounds per simulation: {params['num_rounds']}")
    print(f"  - Total simulations: {params['num_simulations']}")
    print(f"  - Total matching events: {params['total_events']:,}")
    print(f"  - Mixed pairs found: {len(results['mixed_pairs']):,}")

def print_top_connections(conn_AB, conn_BA, label="A→B"):
    print(f"\nTop 5 {label} Attractions:")
    for (arch1, arch2), strength in sorted(conn_AB.items(), key=lambda x: x[1], reverse=True)[:5]:
        reverse_strength = conn_BA.get((arch2, arch1), 0.0)
        asymmetry_marker = " ⚡" if (strength > 0.15 and reverse_strength < 0.08) else ""
        print(f"  {arch1:20s} → {arch2:20s} (strength: {strength:.3f}, reverse: {reverse_strength:.3f}){asymmetry_marker}")

# ============================================================================
# MAIN EXECUTION FUNCTIONS
# ============================================================================

def run_monte_carlo_simulation(config: SimulationConfig):
    results = run_simulation_with_connection_tracking(
        num_users=config.num_users,
        num_rounds=config.num_rounds,
        num_simulations=config.num_simulations
    )
    return results

def analyze_curated_synergy(results, max_samples=500):
    print_header("PART 2: CURATED SYNERGY EXAMPLE")
    if not results['mixed_pairs']:
        print("No mixed pairs found.")
        return

    print("Searching for high-synergy pair...")

    pair_synergies = []
    for i, pair in enumerate(results['mixed_pairs'][:max_samples]):
        weighted_A = apply_ladder_bonus(pair['user1_alignments'])
        weighted_B = apply_ladder_bonus(pair['user2_alignments'])
        conn_AB, conn_BA = calculate_connection_strength(weighted_A, weighted_B)
        synergy, examples = calculate_synergy_score(conn_AB, conn_BA)

        # Ensure examples is always a list
        if examples is None:
            examples = []
        elif isinstance(examples, dict):
            examples = [examples]

        pair_synergies.append((i, synergy, examples))

    best_pair_idx, best_synergy, best_examples = max(pair_synergies, key=lambda x: x[1])
    best_pair = results['mixed_pairs'][best_pair_idx]

    print(f"Found synergy pair (synergy score: {best_synergy:.3f})")
    print(f"  Person A: Top archetype = {best_pair['user1_alignments'][0]['persona']}")
    print(f"  Person B: Top archetype = {best_pair['user2_alignments'][0]['persona']}")

    if best_examples:
        print(f"\nAsymmetric Pathways Found:")
        for ex in best_examples[:3]:
            pathway_A_to_B = ex.get('pathway_A_to_B', 'N/A')
            pathway_B_to_A = ex.get('pathway_B_to_A', 'N/A')
            gap_A_to_B = ex.get('gap_A_to_B', 0.0)
            gap_B_to_A = ex.get('gap_B_to_A', 0.0)
            diagnostic = ex.get('diagnostic', 'N/A')

            print(f"  {pathway_A_to_B} | {pathway_B_to_A}: "
                  f"Gap A→B={gap_A_to_B:.3f}, Gap B→A={gap_B_to_A:.3f}, "
                  f"Diagnostic={diagnostic}")
    else:
        print("No asymmetric pathways found.")

    conn_AB, conn_BA = visualize_pair_connection(best_pair, "SYNERGY EXAMPLE: ")
    print_top_connections(conn_AB, conn_BA, "A→B")
    print_top_connections(conn_BA, conn_AB, "B→A")

def plot_aggregate_analysis(results, sample_size=100):
    print_header("PART 3: AGGREGATE CONNECTION ANALYSIS (MIXED PAIRS)")

    aggregate_stats = analyze_aggregate_connections(results['mixed_pairs'], sample_size=sample_size)

    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle('Aggregate Connection Patterns Across Mixed Pairs', fontsize=16, fontweight='bold')

    # Connection strength distributions
    axes[0].hist(aggregate_stats['all_strengths_AB'], bins=30, alpha=0.6, color='green', label='A→B')
    axes[0].hist(aggregate_stats['all_strengths_BA'], bins=30, alpha=0.6, color='orange', label='B→A')
    axes[0].set_xlabel('Connection Strength')
    axes[0].set_ylabel('Frequency')
    axes[0].set_title('Distribution of Connection Strengths')
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    # Synergy score distribution
    axes[1].hist(aggregate_stats['synergy_scores'], bins=30, color='purple', alpha=0.7)
    axes[1].axvline(aggregate_stats['avg_synergy'], color='red', linestyle='--', linewidth=2,
                    label=f"Mean: {aggregate_stats['avg_synergy']:.3f}")
    axes[1].set_xlabel('Synergy Score')
    axes[1].set_ylabel('Frequency')
    axes[1].set_title('Distribution of Synergy Scores')
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.show()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    config = get_simulation_config()
    results = run_monte_carlo_simulation(config)

    print_header("PART 1: MONTE CARLO STATISTICAL RESULTS")
    persona_counts, rank_counts, match_counts = plot_monte_carlo_results(results)
    print_simulation_summary(results)

    # Display archetype stats
    print(f"\nTop 5 Most Selected Archetypes:")
    for persona, count in persona_counts.most_common(5):
        percentage = (count / sum(persona_counts.values())) * 100
        print(f"  {persona:20s}: {count:6d} selections ({percentage:.1f}%)")

    print(f"\nRank Selection Distribution:")
    for label, r_range in [("Rank 1-3", range(1, 4)), ("Rank 4-8", range(4, 9)), ("Rank 9-16", range(9, 17))]:
        count = sum(rank_counts.get(r, 0) for r in r_range)
        pct = count / sum(rank_counts.values()) * 100
        print(f"  {label}: {count:6d} ({pct:.1f}%)")

    print(f"\nMatch Type Distribution:")
    for match_type, count in match_counts.items():
        pct = count / sum(match_counts.values()) * 100
        print(f"  {match_type:20s}: {count:6d} ({pct:.1f}%)")

    analyze_curated_synergy(results)
    plot_aggregate_analysis(results)

    print("\n" + "=" * 70)
    print("ANALYSIS COMPLETE!")
    print("=" * 70)
