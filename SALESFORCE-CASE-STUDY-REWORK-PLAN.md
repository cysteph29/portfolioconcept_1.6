# Salesforce Trailhead case study rework plan

`/work/salesforce-trailhead` stays the published case study. Redesign work belongs in `/work/salesforce-trailhead-preview`.

The preview opening is now a short title, one sentence, and a two-row product gallery. The case-study body under that gallery is still the current story. Later sections have not been rewritten.

| URL | Content file | What it is |
| --- | --- | --- |
| http://localhost:3000/work/salesforce-trailhead | `src/content/case-studies/salesforce-trailhead.mdx` | Published case study. Do not edit it during this rework. |
| http://localhost:3000/work/salesforce-trailhead-preview | `src/content/case-studies/salesforce-trailhead-preview.mdx` | Unlisted `noindex` draft. Opening gallery is in place. The body is still the published story. |

The preview is registered in `UNLISTED_CASE_STUDIES`. Homepage cards still come from `CASE_STUDIES` only.

## What to borrow

Three references, none of them a new visual system. This site keeps its type, color, case-study layout, and navigation.

**Vraj Shah, [Profound and Peec AI](https://vraj.me/).** The work appears before the explanation. A product name and two or three short lines, then a gallery of real screens: one large moving piece, tight crops of a control or a result, and fuller product views. Pieces vary in size and proportion. The page color between them is the spacing. Peec is a long wall of screens. Profound is the closer model, and even that is longer than this case study should be. Our gallery stops at two rows on a laptop, three on a phone, and then the writing starts.

**Rachel Chen’s [Notion Custom Agents](https://www.rachelchen.tech/projects/notion).** After the product is on screen, the case study is problem, exploration, decision, result. She shows alternatives only when they explain a choice. Code shows up late, tied to a constraint she designed around.

**Shaun Tan’s [Proof story](https://shaun.design/).** A diagram replaces a paragraph. The job-ID strip, the “30% of chats” figure, and the old-model / new-model pair do the arguing. Product chapters are a heading plus the interface. Metrics come after the product. Reflection is short.

The Axway rework named explanatory motion and then left much of it as existing screenshots or an explicit deferral. The learner-journey, rejected-concept, and question-to-learning diagrams are still part of this draft. The opinion-versus-behavior comparison stays compact. The Figma-to-prototype diagram is optional. If a diagram does not replace a paragraph, it does not get built.

## Audit of the current page

The published page has 15 table-of-contents labels and about a thousand words of prose, plus bullets. The story is already good. The length comes from restating it.

| Current section | Verdict | Why |
| --- | --- | --- |
| Overview | Keep as a separate project overview | Establish Trailhead, the project objective, my role, the five-person team, and the 10-month capstone. Do not introduce plain-language answers or learning recommendations here; those belong in the solution. |
| Problem | Cut the second paragraph | “Expensive to lose” repeats the overview. Community-as-engine matters later, as the reason the AI proxy was tempting, not as its own setup. |
| Research ops | Compress to one line | 650+ reached, 72 qualified, 12 interviews, two rounds. Geography is optional color. The decision is round one versus round two: opinions were agreeable, behavior changed the product. |
| Findings | Keep the finding, replace the graphic | Drop-off after certification, and questions leaving for ChatGPT, YouTube, and Slack, are the spine. The current curve does not show where those tools enter. |
| Percentage cards | Keep two, demote two | 64% left after milestones and 45% supplemented Trailhead are the decision. “Content too shallow” becomes one clause under why more courses lost. 36% unhappy with personalization is the weakest card. It does not, by itself, justify the proactive system. |
| “Two ideas stood out” | Cut as a section | The next two headings already say this. “Vibe-coded” and the list of other directions add process. |
| AI community proxy | Keep, as a diagram | Trust, disclosure, approval killing the time savings, and no demand for community. This is the strongest judgment on the page. |
| Public skill profile | Keep the kill, shrink the mock | Employer adoption was outside our control, and a public score would drive activity without learning. The tall profile screenshot proves the concept existed. It does not explain the failure. |
| The bet | Keep, as a loop | Experienced users needed help with the work, not another course. Solve and proactive prompts only make sense together. The OpenAI constraint stays. |
| Solve | Show the product, cut the feature list | Asking, a sourced answer, and a path into Trailhead content are visible in the videos. Depth levels and community escalation are copy only. |
| Proactive prompts | One product visual, no bullet list | Renewal, skill gap, and a follow-up from the question are all in `case-study-trailhead-4.webp`. The bullets repeat the annotations. |
| The build | Compress to the differentiator | Figma into a working prototype is the point. React, Express, SQLite, and voice input are an inventory. |
| Agentic testing | One sentence, not a chapter | 12 agents from the research caught obvious problems before real sessions. They were not the evidence. |
| Impact, preference | Lead with this | Same Salesforce question, both tools. 6 of 8 preferred Solve. 4.5/5 confidence. |
| Impact, duration | Keep, and flag | +35% session duration and −22% drop-off stay in the draft. The page does not say who was measured, against what baseline, or that this was a prototype. The rewrite needs that context. It should not read as a production launch. Do not drop the figures while that context is still open. |
| Reflection | Rewrite, shorter | The code lesson stays. Add the two product lessons already earned above: behavior over opinion, and killing a plausible idea. |

### Claims to keep qualified

Wording still has to stay accurate. The duration figures stay in the draft with a flag, rather than being cut.

- **“Shipped.”** The page uses “shipped” for two features and for Solve as a working app. The evidence is a prototype test. Say prototype.
- **Agentforce on screen, OpenAI in the build.** The recordings and dashboard are labeled Agentforce. The copy says access to Agentforce and to Salesforce’s proprietary data was never available, so the team built on OpenAI with curated Salesforce documentation. Captions need to keep that distinction. The draft should not imply a production Agentforce launch.
- **+35% and −22%.** Keep both. They need a measurement note: who, the baseline, and that the result came from the prototype. Do not invent that note, and do not delete the figures while it is missing.
- **Unused scores on `case-study-trailhead-3.webp`.** That image also says 5 of 8 found dashboard insights they would not have explored, and 6 of 8 expressed return intent. The published prose does not use these. Leave them out unless you want them held to the same standard as the duration claims.
- **64% and 45%.** The page never says whether these are shares of the 72 qualified people, the 12 interviews, or another base. Keep the figures, and add the base only if you know it. Do not guess.
- **Engagement curve.** `case-study-trailhead-5.webp` has no scale. It is a schematic. The replacement must stay a schematic. No invented percentages on the line.
- **`case-study-trailhead-6.webp`.** The green caption asks about “temporary engagement.” The profile decision rejected activity that was not meaningful learning. Do not put this diagram back on the page.

## Opening gallery

This is in place on the preview. The published page still opens with the full-width promo and the long card title.

The preview H1 is “Salesforce Trailhead.” One sentence follows: “Plain-language answers to real Salesforce problems, and a prompt for what to learn next.” The homepage card title is unchanged, because the preview is unlisted.

The gallery is two rows, built only from existing product footage and one crop of the dashboard:

1. `video-trailhead-promo-web.mp4`, large. A lead-assignment question, a sourced answer, then a recommended trail. Playback pauses when motion is reduced, or when the video leaves the viewport.
2. `opening/skills.webp`, beside the video. The “Skills employers want” widget from `case-study-trailhead-4.webp`, without the presentation callouts.
3. `opening/references.webp`. The Web-to-Lead answer and its Salesforce documentation links.
4. `opening/trail.webp`. The Developer Intermediate trail the answer leads into.

On a phone the video, the skill widget, and the trail stack into three rows. The references crop is left off at that width, because it is a paragraph and would be unreadable. The video still shows those sources. The rejected skill-profile mock, the engagement curve, the whiteboards, and the stat cards are not in this gallery.

Below the gallery, the current case-study body is unchanged.

## Approved narrative

Six sections follow the gallery. The opening gallery is already implemented and remains unchanged. Project context is separate from research findings, and the large headings must communicate the story without relying on small labels.

### Project overview

**Heading:** Salesforce Trailhead, built for the work after certification.

Keep this concise: Trailhead is Salesforce’s learning platform; the project aimed to understand and improve return behavior among experienced users; I led ResearchOps and contributed to strategy and AI prototyping; the team had five people; and the capstone lasted 10 months. Remove the current sentence about plain-language answers and learning recommendations from this context. Do not preview the solution here.

### 01. Problem

**Heading:** Trailhead got people certified. The work happened somewhere else.

Explain why experienced users stopped returning after certification and what behavioral research revealed. Keep the learner-journey diagram: learning, certification, then the job, with real work questions moving to ChatGPT, Slack, and YouTube. Keep the research evidence: 650+ reached, 72 qualified, 12 interviews, two rounds; 64% left after milestones and 45% supplemented Trailhead with other tools, with the percentage bases still requiring confirmation. Use a compact opinion-versus-behavior comparison to show why observed behavior changed the direction. Keep “content too shallow” as a clause, not a separate finding. Do not give 36% unhappy with personalization its own card.

### 02. Solution

**Heading:** Solve answered the work question. Proactive recommendations brought learning back into the flow.

Introduce Solve and proactive recommendations as two connected experiences. Let `video-trailhead-chatbot.mp4` and `case-study-trailhead-4.webp` carry most of the explanation. Use concise copy for the meaningful decisions: a sourced answer connected to Trailhead learning, and recommendations tied to the learner’s work, renewal, or skill gaps. Mention the Agentforce/OpenAI constraint accurately. Depth controls and the community-post draft get at most one sentence each if they remain; do not invent UI or repeat feature annotations. Keep the working-prototype point and the 12 research-based agents brief, without a stack inventory or process chapter.

### 03. Design decisions — rejected ideas

**Prominent heading:** Two promising ideas we rejected.

This heading must make rejection explicit; small labels cannot carry that meaning.

**AI community proxy.** Explain the proposed idea, then the tradeoff: an assistant answering as a community leader could save time, but impersonation risked trust, disclosure changed the expectation, approval overhead erased the time savings, and users did not want more community work. Use a compact diagram only if it replaces this explanation.

**Public skill profile.** Explain the proposed idea, then the tradeoff: a shareable profile could motivate return, but its value depended on employer adoption outside the product and could reward superficial score maintenance rather than meaningful learning. Keep `case-study-trailhead-7.webp` once as evidence of the concept, not as the explanation itself.

### 04. Validation

**Heading:** Six of eight preferred Solve for a Salesforce question they already had.

Explain the working prototype, the same-question comparison with ChatGPT, and the validated outcomes. Keep 6/8 preference and 4.5/5 confidence. Keep +35% session duration and −22% drop-off, but visibly flag them until who was measured, the baseline, and confirmation that the figures came from the prototype are known. Do not present them as launch metrics. Keep unused dashboard scores off the page unless their context is also established.

### Closing — Reflection

**Heading:** The best brief came from behavior.

End with a short personal takeaway on behavioral research, product judgment, and designing through code. The reflection should connect observed behavior over opinion, rejecting plausible ideas for specific reasons, and building a prototype that made the preference test possible. Keep the code lesson to one sentence.

## Visuals still to build

The opening gallery is done. These replace prose in the five sections. Anything not listed stays as existing media or as a sentence.

| Visual | Explains | Replaces | Build |
| --- | --- | --- | --- |
| Learner journey | Where engagement turns, and which tools take the question | Problem copy and `case-study-trailhead-5.webp` | New SVG/React diagram. Schematic. Reduced motion shows the final state. |
| Opinion versus behavior | Why the research direction changed | The research-methods paragraphs | Compact comparison inside section 01. Not a chapter, a map, or a funnel. |
| Two rejected concepts | How each idea worked, and the specific break | The proxy and profile paragraphs | Two small SVG diagrams only if they clarify the tradeoffs. The prominent section heading must state that the ideas were rejected. |
| Question-to-learning loop | Why Solve and proactive recommendations are one strategy | The strategy paragraphs | Optional; the product video and recommendation visual may be enough. |
| Figma to prototype | Why the test used a working prototype | The build and agent paragraphs | Optional. A sentence is enough if the diagram does not add a decision. |

Do not build: a research-ops infographic, an icon row of features, a fake ChatGPT transcript, a quantitative engagement chart, a rebuilt dashboard, or a depth-toggle animation without a source frame.

New diagram components are imported only by the preview MDX. `CaseFigure`, `CaseVideo`, and `CaseMetrics` stay shared. `ImagePlaceholder` is not a stand-in for any diagram.

## Existing assets

| Asset | Published page | Preview |
| --- | --- | --- |
| `video-trailhead-promo-web.mp4` | Full-width opening | Gallery hero. Do not play it again in the solution section. |
| `opening/solve-poster.webp`, `references.webp`, `trail.webp` | Not used | Crops from that promo. Gallery only. |
| `opening/skills.webp` | Not used | Crop of the skill-gap widget from `case-study-trailhead-4.webp`. Gallery only. |
| `video-trailhead-chatbot.mp4` | Solve section | Stays in the solution section. Its ending frame leaves the prototype for Salesforce developer docs. Caption that, or stop the stills at the Trailhead modules. |
| `case-study-trailhead-5.webp` | Findings | Retire once the learner-journey diagram exists. |
| `case-study-trailhead-4.webp` | Proactive prompts | Reuse once in the solution section. The gallery already shows the skill widget. |
| `case-study-trailhead-7.webp` | Killed profile | Reuse once, after the profile diagram. |
| `case-study-trailhead-1.webp`, `2.webp`, `3.webp`, `6.webp` | Not used | Leave unused. Whiteboards, duplicate stat cards, extra scores, and the temporary-engagement diagram. |
| `CaseMetrics` | Preference, then duration | 6/8, 4.5/5, and the flagged +35% / −22%. |
| `CasePercentageCards` | Four findings | At most the 64% and 45% figures. Not all four cards. |

## Still open

1. Measurement context for +35% session duration and −22% drop-off. Who, what baseline, and confirmation that it was the prototype.
2. Whether the unused 5/8 dashboard and 6/8 return-intent scores belong once that same context exists.
3. Depth control and the community-post draft. One sentence each, with no invented UI, unless a real frame turns up.
4. The base for 64% and 45%, if you know it.

## Next implementation step, after approval

Rewrite the preview body through the approved Project overview and section 01: separate the overview from the problem, remove the solution preview from the overview, and preserve the learner-journey evidence with the compact opinion-versus-behavior comparison. Leave the gallery and later sections unchanged until that first implementation is reviewed.
