![Image](https://m.media-amazon.com/images/I/81HkLnkMvbL.jpg?utm_source=chatgpt.com)

![Image](https://i5.walmartimages.com/seo/DOS-Second-Edition-Card-Game-For-Game-Night-Featuring-Two-Discard-Plies-Updated-Rules_18f1c7ac-37cc-4b2a-a0d8-82262c0f2e70.8da31f0cb410b0a3367d9c695a0bca9c.jpeg?utm_source=chatgpt.com)

![Image](https://mir-s3-cdn-cf.behance.net/projects/404/005b9395929655.Y3JvcCw4MDgsNjMyLDAsMg.png?utm_source=chatgpt.com)

![Image](https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/ffba2495929655.5ea2b7382a020.png?utm_source=chatgpt.com)

Got it — thanks for correcting that. I’ll **lock the rules exactly as you described** and then give you a **clean, precise, no-ambiguity game plan**, including **all cases**, **state transitions**, and **real-time visibility**, assuming a **2-player Linera real-time game**.

Below is the **final authoritative design**.

---

# 1. Fixed Game Rules (No Assumptions)

* **Players:** Exactly 2
* **Cards:**

  * 22 total cards
  * 11 unique images
  * Each image appears **exactly twice**
* **Turn rule:**

  * In **one turn**, a player **must choose exactly 2 cards**
* **Scoring rule:**

  * If both cards match → **+1 point**
  * If not → **0 points**
* **Card behavior:**

  * If cards **match** → **both cards disappear permanently**
  * If cards **do not match** → **both cards flip back**
* **Turn behavior:**

  * After **every turn**, the turn **always passes** to the other player
  * (No extra turns for matching)

---

# 2. Room & Player Flow

## 2.1 Room Creation

A player can:

* Create **Public Room**
* Create **Private Room** (with room code)

Room fields:

```text
room_id
room_type: PUBLIC | PRIVATE
room_code (private only)
player_1
player_2
state
```

Room states:

```text
WAITING   → only 1 player
READY     → 2 players joined
IN_GAME   → game started
FINISHED  → game over
```

---

# 3. Game Initialization (Once Room Is READY)

## 3.1 Deck Creation

* Create list of 11 image IDs
* Duplicate each → 22 cards
* Shuffle deterministically

Each card:

```text
card_id: 0..21
image_id: 0..10
state:
  - HIDDEN
  - REVEALED
  - REMOVED   ← important (disappeared)
```

---

## 3.2 Initial Game State

```text
current_turn: player_1 (or random)
scores:
  player_1: 0
  player_2: 0
selected_cards: empty
```

---

# 4. Turn Mechanics (Very Important)

Each turn is **atomic** and strictly enforced.

---

## 4.1 Turn Start

* `selected_cards = []`
* Only `current_turn` player may act
* Opponent actions are rejected

---

## 4.2 Card Selection Rules

During a turn:

### Allowed:

* Select **only cards with state = HIDDEN**
* Select **exactly 2 cards**
* Cannot select the same card twice

### Forbidden:

* Selecting more than 2 cards
* Selecting REMOVED or already REVEALED cards
* Selecting when it’s not your turn

---

## 4.3 First Card Pick

* Player selects card A
* Card A → `REVEALED`
* Broadcast event:

```text
CardRevealed(card_id, image_id, by_player)
```

👉 **Both players see it instantly**

---

## 4.4 Second Card Pick

* Player selects card B
* Card B → `REVEALED`
* Broadcast event again

👉 **Both players now see both cards**

---

# 5. Turn Resolution (After 2 Cards)

Now the system resolves the turn.

---

## 5.1 Case 1: Cards Match

### Condition:

```text
card_A.image_id == card_B.image_id
```

### Effects:

* card A → `REMOVED`
* card B → `REMOVED`
* Player score += 1

Broadcast:

```text
CardsRemoved(card_A, card_B)
ScoreUpdated(player, new_score)
```

UI result:

* Cards disappear from table
* Score updates immediately for both players

---

## 5.2 Case 2: Cards Do NOT Match

### Effects:

* Cards remain visible briefly (UX delay)
* card A → `HIDDEN`
* card B → `HIDDEN`

Broadcast:

```text
CardsHidden(card_A, card_B)
```

UI result:

* Both players see cards flip back

---

## 5.3 Turn Ends (Always)

* Turn **always passes**, regardless of match result

```text
current_turn = other_player
selected_cards = []
```

Broadcast:

```text
TurnChanged(next_player)
```

---

# 6. Real-Time Visibility Rules

Both players **always see the same board state**:

✔ Every card flip
✔ Every card disappearance
✔ Every score update
✔ Every turn change

There is **zero private information** in the game.

---

# 7. Scoring System (Strict)

* Score increases **only** when:

  * Two selected cards match
* One match = **exactly +1**
* Max total points in game = **11**

---

# 8. Game End Conditions

Game ends when:

```text
all cards.state == REMOVED
```

---

## 8.1 Winner Determination

* Player with higher score wins
* If scores equal → draw

Broadcast:

```text
GameEnded(winner | draw)
```

---

# 9. Edge Cases (Handled Explicitly)

### 9.1 Player Disconnects

* Short reconnect window
* If not returned → opponent wins by forfeit

### 9.2 Invalid Actions

Automatically rejected:

* Playing out of turn
* Selecting invalid cards
* Acting after game ends

No UI trust — **logic enforced by contract**