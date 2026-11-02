<!-- Modified: 2026-10-31 -->

# Network-only split and rejoin harness

Open `splitRejoin.html` to inspect three circuits. The first follows the four-path `splitRejoin.jpg` reference: an outer tee splits the input into two groups, and each group splits again into two paths. Matching tee trees combine all four paths at the output. The second uses `Tee4()` junctions for three paths. The third uses one `Tee5()` at each end for four paths with different components. The renderer uses each circuit's `nodal()` connections without a shape hint.

These cases exercise the network-only renderer's general connection routing. The drawings may be less regular than the hand-drawn reference, but they retain each direct component and its numbered ports.
