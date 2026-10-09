# Rules research and implementation choices

Researched 9 October 2026.

## Primary sources

- [Hasbro E3113 official product and instructions page](https://instructions.hasbro.com/en-gb/instruction/monopoly-deal-card-game): player count, product scope, and goal.
- [Hasbro 2008 instruction leaflet, hosted by Buffalo & Erie County Public Library](https://www.buffalolib.org/sites/default/files/gaming-unplugged/inst/Monopoly%20Deal%20Card%20Game%20Instructions.pdf): standard deck inventory, turns, payments, and action-card behavior. This is the selected rules edition. The PDF carries Hasbro’s authorship and copyright.
- [2017 Hasbro leaflet mirror](https://www.monopolyland.com/wp-content/uploads/Monopoly-Deal-Rules.pdf): consulted for edition differences. It uses the discard pile for excess hand cards; the selected 2008 leaflet puts them below the draw pile.

## Implemented core

The deck contains 106 playable cards; four reference cards are represented by the in-game help. Players begin with five. A turn draws two, or five from an empty hand, allows up to three plays, and ends at seven or fewer cards. Three complete sets of different colours win on the owner’s turn.

Only table assets pay debts. The payer selects assets; overpayment receives no change. Banked actions remain money. Property payments join the recipient’s collection. Zero-value rainbow wilds cannot pay debts.

Colour-pair rent charges all opponents; any-colour rent selects one. Doublers consume separate plays. Buildings increase rent; a hotel requires a house. Sly Deal and the receiving side of Forced Deal target incomplete sets. Deal Breaker takes a complete group with buildings. Just Say No supports back-and-forth counters; group actions resolve separately for each opponent.

## Explicit digital conventions

The leaflet does not settle every ordering/edge case. These are implementation choices, not claimed Hasbro rulings:

- Reactive Just Say No cards never consume the three ordinary turn plays.
- A group must contain at least one property with monetary value to earn rent or count as complete; two zero-value rainbow wilds cannot form a winning set alone.
- If removal or rearrangement breaks an improved group, its remaining buildings move to the owner’s bank as money. Buildings paid directly also go to the recipient’s bank. Paying a house while keeping a hotel moves the now-unattached hotel to the payer’s bank.
- Forced Deal may offer a property from the acting player’s complete group; the opponent’s selected property must be outside a full group.
- A double-rent combo is submitted together; a No response blocks the combined demand for that recipient.
- A complete group is capped at its required size; additional same-colour cards start or fill another group. Duplicate colours only count once towards victory.
- The host goes first. There is no imposed human response timer. Bots respond after a short pause.
- The discard pile is shuffled into a new draw pile when needed. If no cards remain in either pile, play continues without drawing.

The server checks all commands against the current turn, phase, card ownership, and room revision. The HTTP client receives its own hand and only opponents’ hand counts, never deck order or opponents’ session tokens.
