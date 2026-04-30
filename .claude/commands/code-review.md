---
allowed-tools: Read(*)
description: Perform a code-review
---

MODE: $ARGUMENTS

If Mode is one of the following, adjust the review as described:

- MODE == BUGS: Focus ONLY on logical or other bugs.
- MODE == SECURITY: Focus ONLY on security issues.
- MODE = PERFORMANCE: Focus ONLY performance issues.

MODE can also be set to a combination like "BUGS,SECURITY" etc => Perform the combined review in that case.

If MODE is set to anything else or nothing at all, perform a thorough, general code review.

Perform an in-depth code review of the entire codebase.

Carefully and thoroughly explore the codebase file-by-file to find potential issues and improvements.

Don't rush it, instead make sure you fully understand the code structure and architecture.

Create a detailed report of all your findings.

## Skills to apply during review

Load and apply these skills before generating findings — each covers a specific review lens:

- **Security**: `.claude/skills/web-security/SKILL.md` — auth, input validation, XSS, token handling, server-side enforcement
- **React**: `.claude/skills/modern-best-practice-react-components/SKILL.md` — state, effects, event handlers, composition
- **Next.js**: `.claude/skills/modern-best-practice-nextjs/SKILL.md` — App Router, server components, server actions, metadata
- **TypeScript**: `.claude/skills/clean-typescript/SKILL.md` — type safety, avoid `any`/`!`, explicit return types
- **Accessibility**: `.claude/skills/modern-accessible-html-jsx/SKILL.md` — semantic HTML, ARIA, keyboard access, form labels
- **Tailwind**: `.claude/skills/modern-tailwind/SKILL.md` — class organisation, responsive, state variants
- **Browser APIs**: `.claude/skills/modern-browser-apis/SKILL.md` — prefer native APIs over third-party where applicable