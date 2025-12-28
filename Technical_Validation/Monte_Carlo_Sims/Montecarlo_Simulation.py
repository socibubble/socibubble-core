"""
Archetype Matching System - Monte Carlo Simulation (3D Version with Input)
Copy this entire script into Google Colab and run it
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter, defaultdict
import random
from mpl_toolkits.mplot3d import Axes3D
from scipy.interpolate import griddata

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

# 16 Archetypes with their interest vectors (52 binary values each)
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

# Ladder Bonuses (rank 1-16)
LADDER_BONUSES = [
    0.60, 0.56, 0.55, 0.54, 0.53, 0.52, 0.51, 0.50,
    0.49, 0.48, 0.45, 0.43, 0.42, 0.41, 0.20, 0.05
]

# ============================================================================
# CORE FUNCTIONS
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

    # Sort by percentage descending
    scores.sort(key=lambda x: x['percentage'], reverse=True)
    return scores

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
        # Equal distribution fallback
        inc = 100 / len(weighted)
        cumulative = 0
        dice = []
        for w in weighted:
            cumulative += inc
            dice.append({'persona': w['persona'], 'cumulativeMax': cumulative})
        return dice

    # Create cumulative distribution
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
            'selected_persona': selected_persona,
            'rank': rank,
            'top_alignment': alignments[0]['percentage'] if alignments else 0
        })

    return selections

def pair_users(selections):
    """Pair users based on their selected personas"""
    # Group by persona
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
                'user1': u1['user_id'],
                'user2': u2['user_id'],
                'persona': persona,
                'rank1': u1['rank'],
                'rank2': u2['rank']
            })
        remaining.extend(users)

    # Random fallback for remaining
    if len(remaining) >= 2:
        random.shuffle(remaining)
        while len(remaining) >= 2:
            u1 = remaining.pop()
            u2 = remaining.pop()
            matches.append({
                'user1': u1['user_id'],
                'user2': u2['user_id'],
                'persona': 'mixed',
                'rank1': u1['rank'],
                'rank2': u2['rank']
            })

    return matches, [r['user_id'] for r in remaining]

# ============================================================================
# SIMULATION
# ============================================================================

def run_simulation(num_users=500, num_rounds=10, num_simulations=100):
    """Run Monte Carlo simulation"""

    all_results = {
        'persona_selections': [],
        'rank_distributions': [],
        'match_patterns': [],
        'entropy_metrics': [],
        'parameters': {
            'num_users': num_users,
            'num_rounds': num_rounds,
            'num_simulations': num_simulations,
            'total_events': num_users * num_rounds * num_simulations
        }
    }

    for sim in range(num_simulations):
        # Generate completely random users (5 interests each)
        users = {f"User_{i}": generate_random_user_interests(5) for i in range(num_users)}

        simulation_data = {
            'persona_counts': Counter(),
            'rank_counts': Counter(),
            'match_types': Counter(),
            'persona_pairs': Counter()
        }

        for round_num in range(num_rounds):
            selections = run_matching_round(users)
            matches, remaining = pair_users(selections)

            # Track selections
            for sel in selections:
                simulation_data['persona_counts'][sel['selected_persona']] += 1
                simulation_data['rank_counts'][sel['rank']] += 1

            # Track matches
            for match in matches:
                simulation_data['match_types'][match['persona']] += 1
                pair = tuple(sorted([match['persona'], match['persona']]))
                simulation_data['persona_pairs'][pair] += 1

        all_results['persona_selections'].append(dict(simulation_data['persona_counts']))
        all_results['rank_distributions'].append(dict(simulation_data['rank_counts']))
        all_results['match_patterns'].append(dict(simulation_data['match_types']))

    return all_results

# ============================================================================
# VISUALIZATION
# ============================================================================

def create_3d_topographical_map(persona_counts):
    """Create 3D topographical map of archetype selection frequencies"""

    # Create coordinate system for archetypes based on interest similarity
    archetype_names = list(PERSONAS.keys())

    # Calculate similarity matrix between archetypes
    similarity_matrix = []
    for i, (name1, vector1) in enumerate(PERSONAS.items()):
        row = []
        for j, (name2, vector2) in enumerate(PERSONAS.items()):
            # Jaccard similarity
            intersection = sum(1 for a, b in zip(vector1, vector2) if a == 1 and b == 1)
            union = sum(1 for a, b in zip(vector1, vector2) if a == 1 or b == 1)
            similarity = intersection / union if union > 0 else 0
            row.append(similarity)
        similarity_matrix.append(row)

    # Simple 2D positioning based on index for now (can be enhanced with MDS)
    # Arrange in a 4x4 grid
    grid_positions = []
    for i in range(16):
        x = i % 4
        y = i // 4
        grid_positions.append([x, y])

    positions = np.array(grid_positions)
    x_coords = positions[:, 0]
    y_coords = positions[:, 1]
    frequencies = np.array([persona_counts.get(name, 0) for name in archetype_names])

    # Create meshgrid for interpolation
    xi = np.linspace(-0.5, 3.5, 100)
    yi = np.linspace(-0.5, 3.5, 100)
    XI, YI = np.meshgrid(xi, yi)

    # Interpolate frequencies over the grid
    ZI = griddata((x_coords, y_coords), frequencies, (XI, YI), method='cubic', fill_value=0)
    ZI = np.maximum(ZI, 0)  # Ensure no negative values

    # Create figure with subplots
    fig = plt.figure(figsize=(18, 14))

    # 1. Main 3D topographical surface plot
    ax1 = fig.add_subplot(221, projection='3d')
    surf = ax1.plot_surface(XI, YI, ZI, cmap='terrain', alpha=0.7,
                           edgecolor='none', antialiased=True,
                           linewidth=0, shade=True)

    # Add archetype points as peaks
    scatter = ax1.scatter(x_coords, y_coords, frequencies,
                         c=frequencies, cmap='Reds', s=200,
                         alpha=0.9, edgecolors='black', linewidth=1.5)

    # Label top 5 archetypes
    top_indices = np.argsort(frequencies)[-5:]
    for idx in top_indices:
        ax1.text(x_coords[idx], y_coords[idx], frequencies[idx] * 1.05,
                archetype_names[idx], fontsize=9, fontweight='bold',
                ha='center')

    ax1.set_xlabel('X Position', fontsize=10)
    ax1.set_ylabel('Y Position', fontsize=10)
    ax1.set_zlabel('Selection Frequency', fontsize=10)
    ax1.set_title('3D Topographical Landscape of Archetype Selections',
                 fontsize=12, fontweight='bold', pad=20)
    ax1.view_init(elev=30, azim=45)

    # 2. Contour map (bird's eye view)
    ax2 = fig.add_subplot(222)
    contourf = ax2.contourf(XI, YI, ZI, levels=20, cmap='terrain', alpha=0.8)
    contour = ax2.contour(XI, YI, ZI, levels=10, colors='black',
                         linewidths=0.5, alpha=0.4)
    ax2.clabel(contour, inline=True, fontsize=7)

    # Plot archetype positions
    scatter2 = ax2.scatter(x_coords, y_coords, c=frequencies,
                          cmap='Reds', s=150, edgecolors='black',
                          linewidth=1.5, zorder=5)

    # Label all archetypes
    for i, name in enumerate(archetype_names):
        ax2.annotate(name[:10], (x_coords[i], y_coords[i]),
                    xytext=(0, -15), textcoords='offset points',
                    fontsize=7, ha='center',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='white',
                             alpha=0.7, edgecolor='none'))

    ax2.set_xlabel('X Position', fontsize=10)
    ax2.set_ylabel('Y Position', fontsize=10)
    ax2.set_title('Contour Map (Top-Down View)', fontsize=12, fontweight='bold')
    plt.colorbar(scatter2, ax=ax2, label='Selection Frequency')
    ax2.set_aspect('equal')
    ax2.grid(True, alpha=0.3)

    # 3. 3D Bar chart
    ax3 = fig.add_subplot(223, projection='3d')

    xpos = x_coords
    ypos = y_coords
    zpos = np.zeros(len(archetype_names))
    dx = np.ones(len(archetype_names)) * 0.6
    dy = np.ones(len(archetype_names)) * 0.6
    dz = frequencies

    colors = plt.cm.plasma(frequencies / frequencies.max())

    ax3.bar3d(xpos, ypos, zpos, dx, dy, dz,
             color=colors, alpha=0.8, edgecolor='black', linewidth=0.5)

    ax3.set_xlabel('X Position', fontsize=10)
    ax3.set_ylabel('Y Position', fontsize=10)
    ax3.set_zlabel('Selection Frequency', fontsize=10)
    ax3.set_title('3D Bar Chart of Archetype Frequencies',
                 fontsize=12, fontweight='bold')
    ax3.view_init(elev=25, azim=45)

    # 4. Heat map with archetype names
    ax4 = fig.add_subplot(224)
    freq_matrix = frequencies.reshape(4, 4)

    im = ax4.imshow(freq_matrix, cmap='YlOrRd', aspect='auto')

    # Set ticks and labels
    ax4.set_xticks(range(4))
    ax4.set_yticks(range(4))

    x_labels = [archetype_names[i] for i in range(0, 4)]
    y_labels = [archetype_names[i*4] for i in range(4)]

    ax4.set_xticklabels(x_labels, rotation=45, ha='right', fontsize=8)
    ax4.set_yticklabels(y_labels, fontsize=8)

    # Add frequency values
    for i in range(4):
        for j in range(4):
            idx = i * 4 + j
            if idx < len(frequencies):
                text = ax4.text(j, i, f'{int(frequencies[idx])}',
                              ha="center", va="center",
                              color="black", fontweight='bold', fontsize=9)

    ax4.set_title('Archetype Frequency Heat Map', fontsize=12, fontweight='bold')
    plt.colorbar(im, ax=ax4, label='Selection Frequency')

    plt.tight_layout()
    plt.show()

    return fig

def plot_results(results):
    """Create comprehensive visualization"""

    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('Archetype Matching System - Monte Carlo Simulation Results', fontsize=16, fontweight='bold')

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
    ax1.set_title('Archetype Selection Frequency Across All Simulations')
    ax1.grid(axis='x', alpha=0.3)

    # 2. Rank Distribution
    all_ranks = []
    for sim_result in results['rank_distributions']:
        for rank, count in sim_result.items():
            all_ranks.extend([rank] * count)

    ax2 = axes[0, 1]
    rank_counts = Counter(all_ranks)
    ranks = sorted(rank_counts.keys())
    counts = [rank_counts[r] for r in ranks]
    ax2.bar(ranks, counts, color='coral')
    ax2.set_xlabel('Rank')
    ax2.set_ylabel('Frequency')
    ax2.set_title('Distribution of Selected Archetype Ranks')
    ax2.set_xticks(range(1, 17))
    ax2.grid(axis='y', alpha=0.3)

    # 3. Match Type Distribution
    all_match_types = []
    for sim_result in results['match_patterns']:
        for match_type, count in sim_result.items():
            all_match_types.extend([match_type] * count)

    match_counts = Counter(all_match_types)

    ax3 = axes[1, 0]
    match_types_sorted = sorted(match_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ax3.barh([m[0] for m in match_types_sorted], [m[1] for m in match_types_sorted], color='mediumseagreen')
    ax3.set_xlabel('Match Count')
    ax3.set_title('Top 10 Match Types (Same Persona Pairs)')
    ax3.grid(axis='x', alpha=0.3)

    # 4. Ladder Bonus Impact
    ax4 = axes[1, 1]
    ranks = list(range(1, 17))
    bonuses = LADDER_BONUSES
    frequencies = [rank_counts.get(r, 0) for r in ranks]

    ax4_twin = ax4.twinx()
    ax4.plot(ranks, bonuses, 'b-o', label='Ladder Bonus', linewidth=2)
    ax4_twin.bar(ranks, frequencies, alpha=0.3, color='orange', label='Selection Frequency')

    ax4.set_xlabel('Rank')
    ax4.set_ylabel('Ladder Bonus', color='b')
    ax4_twin.set_ylabel('Selection Frequency', color='orange')
    ax4.set_title('Ladder Bonus vs Actual Selection Frequency')
    ax4.tick_params(axis='y', labelcolor='b')
    ax4_twin.tick_params(axis='y', labelcolor='orange')
    ax4.set_xticks(range(1, 17))
    ax4.grid(alpha=0.3)
    ax4.legend(loc='upper left')
    ax4_twin.legend(loc='upper right')

    plt.tight_layout()
    plt.show()

    return persona_counts, rank_counts, match_counts

# ============================================================================
# RUN SIMULATION
# ============================================================================

# ============================================================================
# USER INPUT AND RUN SIMULATION
# ============================================================================

print("=" * 70)
print("ARCHETYPE MATCHING SYSTEM - MONTE CARLO SIMULATION (with 3D Visualization)")
print("=" * 70)
print()
print("Recommended configurations:")
print("  - Quick test: 500 users, 10 rounds, 20 simulations (100K events)")
print("  - Standard: 5000 users, 10 rounds, 20 simulations (1M events)")
print("  - Large scale: 10000 users, 10 rounds, 20 simulations (2M events)")
print()

# Get user input
try:
    NUM_USERS = int(input("Enter number of users per simulation (e.g., 500, 5000, 10000): "))
    NUM_ROUNDS = int(input("Enter number of rounds per simulation (e.g., 10): "))
    NUM_SIMULATIONS = int(input("Enter number of simulations to run (e.g., 20, 100): "))
except ValueError:
    print("Invalid input! Using default values: 500 users, 10 rounds, 100 simulations")
    NUM_USERS = 500
    NUM_ROUNDS = 10
    NUM_SIMULATIONS = 100

print()
print("=" * 70)
print(f"Running simulation with:")
print(f"  - Users per simulation: {NUM_USERS:,}")
print(f"  - Interests per user: 5 (randomly selected from 52)")
print(f"  - Rounds per simulation: {NUM_ROUNDS}")
print(f"  - Total simulations: {NUM_SIMULATIONS}")
print(f"  - Total matching events: {NUM_USERS * NUM_ROUNDS * NUM_SIMULATIONS:,}")
print("=" * 70)
print()
print("Generating completely random users with random interest selections...")
print("Running simulation...")
print()

results = run_simulation(num_users=NUM_USERS, num_rounds=NUM_ROUNDS, num_simulations=NUM_SIMULATIONS)

print("Simulation complete! Generating visualizations...")
print()

persona_counts, rank_counts, match_counts = plot_results(results)

print("Creating 3D Topographical Map...")
print()
create_3d_topographical_map(persona_counts)

# Print summary statistics using actual parameters from results
params = results['parameters']
print("=" * 70)
print("SUMMARY STATISTICS")
print("=" * 70)
print()
print(f"Simulation Parameters:")
print(f"  - Users per simulation: {params['num_users']:,}")
print(f"  - Rounds per simulation: {params['num_rounds']}")
print(f"  - Total simulations: {params['num_simulations']}")
print(f"  - Total matching events: {params['total_events']:,}")
print()
print("Top 5 Most Selected Archetypes:")
for persona, count in persona_counts.most_common(5):
    percentage = (count / sum(persona_counts.values())) * 100
    print(f"  {persona:20s}: {count:5d} selections ({percentage:.1f}%)")

print()
print("Rank Selection Distribution:")
print(f"  Rank 1-3:  {sum(rank_counts.get(r, 0) for r in [1,2,3]):5d} ({sum(rank_counts.get(r, 0) for r in [1,2,3])/sum(rank_counts.values())*100:.1f}%)")
print(f"  Rank 4-8:  {sum(rank_counts.get(r, 0) for r in range(4,9)):5d} ({sum(rank_counts.get(r, 0) for r in range(4,9))/sum(rank_counts.values())*100:.1f}%)")
print(f"  Rank 9-16: {sum(rank_counts.get(r, 0) for r in range(9,17)):5d} ({sum(rank_counts.get(r, 0) for r in range(9,17))/sum(rank_counts.values())*100:.1f}%)")

print()
print("This demonstrates emergent patterns (alpha) from your matching system!")
print("=" * 70)