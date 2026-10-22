# BitStreamfi — Product Design Philosophy & UI Specification

**Version:** 1.0  
**Product:** Bitcoin-backed payroll and merchant settlement on Mezo  
**Design reference:** [Anatomy skill](https://github.com/wheresryan22/anatomy)  
**Status:** Design direction + prototype specification

---

## 1. Product idea

BitStreamfi turns idle Bitcoin collateral into productive liquidity and makes money move continuously: users deposit tBTC, borrow MUSD, stream payroll, and may apply eligible staking yield toward debt.

The interface should make this unfamiliar financial mechanism understandable at a glance. It should feel like a precision instrument, not a casino, token launch page, or generic DeFi template.

**Design thesis:** *Money in motion.*

The product's primary visual language is a carefully engineered machine: a collateral vault, a metering rail, and an amortization engine. The machine is an explanation of the protocol, not decorative crypto art.

## 2. Philosophy — name the mechanism, then make it tangible

The Anatomy repository's core idea is to explain a technical concept by inventing a real, working object that embodies it. Build a recognizable mechanism from purposeful parts, make motion reflect the model, and let every readout agree with the same underlying state.

Apply that approach to BitStreamfi:

1. **Collateral is stored, not floating.** Show tBTC seated inside a precision vault.
2. **Borrowing is a measured release.** A gauge and calibrated limit communicate LTV and available borrowing capacity.
3. **Payroll is continuous motion.** A metering carriage moves along a rail as elapsed time accrues.
4. **Yield is routed, not magical.** A distinct yield intake feeds a debt-reduction mechanism.
5. **Trust comes from legibility.** Labels, units, transaction status, source-of-value and safety thresholds remain visible.

Avoid abstract cubes, floating slabs, random arrows, excessive glows, and labels that do not attach to a meaningful part.

## 3. Visual identity

### Mood
Quietly technical, editorial, tactile, precise, calm, transparent.

### Palette
- **Paper:** `#F6F4EF` — main canvas
- **Surface:** `#FBFAF7` — cards and inset panels
- **Ink:** `#171715` — primary text and key actions
- **Secondary:** `#77756F` — supporting text
- **Rule:** `#DEDBD3` — borders and dividers
- **Copper:** `#E66C35` — active flow, primary highlight, key movement
- **Healthy:** `#258454` — healthy / confirmed state
- **Caution:** `#B7791F` — warning state
- **Danger:** `#C7473A` — critical state only

Use copper sparingly. It means *movement or attention*, not generic decoration. Never use color alone to convey a state; pair it with a label/icon.

### Typography
- **Display:** an editorial serif such as Instrument Serif or DM Serif Display.
- **UI/body:** Geist, Inter, or system sans-serif.
- **Data:** Geist Mono or another tabular monospaced face for addresses, rates, amounts, and timestamps.

Use large serif headlines sparingly. Keep controls, labels, numbers, and data tables highly legible.

### Shape and depth
- 1px quiet borders; mostly square corners with modest 8–12px radii.
- No heavy shadows; use subtle surface contrast and thin rules.
- No gradients as a default background.
- Use whitespace and alignment to create hierarchy, not card decoration.
- Keep motion slow, purposeful, and restrained. Respect `prefers-reduced-motion`.

## 4. Information architecture

Primary navigation:
- Overview
- Vault
- Payroll
- Activity

Global controls:
- Mezo Testnet network indicator
- Wallet connection / shortened address
- Clear connected / disconnected states

Overview dashboard order:
1. **Headline:** “Money in motion.”
2. **Collateral instrument:** Anatomy-style vault explainer with tBTC → MUSD relationship.
3. **Vault health:** LTV, collateral value, borrowed amount, available borrowing capacity, max LTV and clear actions.
4. **Live payroll stream:** claimable balance, current accrual rate, progress and time remaining.
5. **Self-repaying credit:** yield applied to debt, amortization history and eligibility status.
6. **Recent activity:** confirmed / pending / failed transactions with transaction links.

On small screens, stack in this order: Vault health, payroll stream, collateral illustration, credit engine, activity. Keep the primary action easy to reach.

## 5. Signature Anatomy objects

### A. Collateral instrument — Hero figure
**Concept:** tBTC collateral supports MUSD borrowing under a maximum LTV constraint.

Invent a compact precision vault with:
- Base plate, feet, corner screws, engraved label plate
- Titanium-like outer casing and visible seams
- Collateral chamber with a single copper-lit Bitcoin medallion
- Locking ring, hinge, bolts and a controlled release port
- Valuation dial with ticks and a clearly marked maximum-LTV threshold
- MUSD liquidity conduit exiting into a settlement rail
- Small sensor panel / status indicator

**Motion:** on deposit, the collateral medallion seats into the chamber and the locking ring closes. On borrow, the MUSD conduit illuminates briefly and the LTV needle moves to its new value. Do not animate money flowing if no transaction/state change occurred.

### B. Payroll metering rail — Secondary figure
**Concept:** earned-but-unclaimed value increases with elapsed time.

Build a linear precision meter with a rail, carriage, calibrated ticks, a transparent metering tube and end stops. The copper-lit inner segment represents accrued value.

**Motion:** carriage position is driven by the stream's actual elapsed fraction. The displayed claimable balance and remaining duration must derive from the same stream model. Pause animation when the stream is inactive or cancelled.

### C. Self-repaying credit engine — Secondary figure
**Concept:** eligible staking yield can be directed toward outstanding debt.

Build a small pump / rotary meter with a yield intake, rotor, debt outlet, and a readable counter. Keep it mechanically plausible and less visually dominant than the vault.

**Motion:** only show a transfer when an actual amortization is recorded. Never imply guaranteed yield or automatic repayment when no transaction or protocol mechanism confirms it.

## 6. Interaction principles

- Every money-moving action shows amount, asset, destination, fees where available, and an explicit confirmation step.
- Distinguish **wallet balance**, **collateral**, **borrowed debt**, **claimable stream value**, **stream funding**, and **yield applied to debt**.
- Show chain/network and contract context before write transactions.
- Show loading, wallet rejection, pending, confirmed, and failed states.
- Never display fabricated live values as if they were on-chain data.
- Explain LTV as `debt value ÷ collateral value`, with valuation source and timestamp where available.
- Warn before a borrow would exceed the contract-enforced limit. Frontend warnings supplement, never replace, contract validation.
- For stream cancellation, clearly preview the recipient's earned amount and the employer's refundable remainder based on contract rules.
- Make keyboard focus visible and use semantic labels for controls.
- Support reduced motion and responsive layouts.

## 7. Data and trust requirements

The dashboard must label demo/placeholder data clearly until it is replaced by verified contract reads.

Never assume the overview's example figures are live. In production:
- Read contract state from the configured Mezo network.
- Use the deployed ABI and verified deployment configuration.
- Format token values with the correct decimals.
- Derive displayed values from chain state or explicitly label an external price oracle and timestamp.
- Make transaction hashes and explorer links available after submission.
- Handle stale RPC data, disconnected wallets, wrong chain, and pending transactions.

The project brief specifies Mezo Testnet chain ID `31611` and these addresses:
- `MezoFlowVault`: `0x34623FB11C65E2Cab4d252460AF1DC0F36ba9D20`
- `PayrollStreamer`: `0x0486bbfC22AA66F61A9fa1c35e221DfB19de6d93`
- `SelfRepayingCreditEngine`: `0x625Cf421C9D7B58E747cf7D6301bdb3f235524f0`

Treat these as user-supplied configuration and verify them against the project's deployment artifacts before using them. The `$60,000 / tBTC` valuation in the brief is a stated model assumption, not a reliable live price source.

## 8. Implementation direction

- Next.js App Router + TypeScript
- Tailwind CSS
- Wagmi + Viem
- Reusable accessible UI primitives
- Keep wallet / contract reads and writes separate from visual components.
- Create a typed data model for vault state, stream state, transaction status and yield/amortization history.
- Keep the Anatomy illustration as an isolated component; use the repository's kit and documented React/server-client split if the skill is installed.
- Start with a static, well-composed SVG figure. Add WebGL only where it communicates a real phenomenon and remains performant.
- Make all geometry purposeful: solid volumes, consistent isometric camera, clear depth order, attached labels, no intersecting pipes, no unexplained floating callouts.
- Provide a static fallback for unsupported WebGL, reduced-motion users, and lower-power devices.

## 9. Suggested component map

```text
app/
  (dashboard)/
    overview/page.tsx
    vault/page.tsx
    payroll/page.tsx
    activity/page.tsx
components/
  shell/
    app-sidebar.tsx
    topbar.tsx
    network-indicator.tsx
  overview/
    collateral-instrument.tsx
    vault-health-card.tsx
    payroll-meter.tsx
    self-repaying-engine.tsx
    recent-activity-table.tsx
  anatomy/
    vault-figure.tsx
    payroll-rail-figure.tsx
    credit-engine-figure.tsx
  wallet/
    connect-wallet.tsx
    transaction-state.tsx
lib/
  chain/
  contracts/
  format/
  models/
```

## 10. Acceptance checklist

- [ ] First screen explains the product without requiring crypto expertise.
- [ ] LTV and the maximum threshold are unmistakable.
- [ ] Vault, payroll, and yield visuals each explain one real mechanism.
- [ ] All example data is labeled as demo data until wired to verified reads.
- [ ] No animation suggests a transaction succeeded before chain confirmation.
- [ ] The dashboard works at 390px width and on desktop.
- [ ] Focus states, semantic labels, and reduced motion are implemented.
- [ ] Token decimals, network errors, wallet rejection and stale reads are handled.
- [ ] Anatomy figures are built from meaningful parts, not generic blocks.
- [ ] Visual motion and numeric readouts share one source of truth.

## 11. Prompt for your coding agent

> Build the BitStreamfi dashboard from this design specification. First inspect the existing repository, current routes, installed packages, contract ABIs, and chain configuration. Do not replace working infrastructure without a reason.
>
> Follow the Anatomy philosophy: the collateral mechanism should become a crafted, interactive isometric precision vault; payroll should become a calibrated metering rail; yield amortization should become a compact debt-reduction engine. The object itself must explain the concept. Plan the parts and their relationships before drawing. Use the Anatomy kit and references if the skill is installed; do not merely imitate its appearance with generic cards.
>
> Implement the overview shell and responsive layout first, then create the vault figure and wire readouts to a typed state model. Keep mock data visibly labeled. Do not invent contract methods or assume the supplied addresses/valuation are verified: inspect project ABIs and deployment files. Build transaction confirmation, pending, success and error states before presenting write actions as complete. Respect reduced motion and include a static fallback. Finish by running the project's lint, typecheck and tests, then capture a browser preview.

## 12. Prototype note

`bitstreamfi-preview.html` is a standalone visual prototype for reviewing layout and style. Its sample figures are illustrative, not live blockchain data. It is not a connected wallet or a production financial application.
