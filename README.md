# Veronica R. — personal portfolio

A buildless, responsive portfolio for GitHub Pages. Plain HTML, CSS, and optional JavaScript; local fonts; no runtime dependencies or third-party trackers.

## Preview

Run `python3 -m http.server 8000` from this folder and visit http://localhost:8000.

## Editorial direction

A personal workbench, rather than a résumé laid out as a website. Lead with purpose, use short project stories, and mix in personal tinkering. Keep the Puerto Rico palette and Mii space. The audience includes research collaborators, recruiters, and curious visitors; the copy does not name a target employer.

Content draws on the supplied résumé, CV, NSF personal statement, and research plan, with user-confirmed updates: Vanderbilt / Dr. Shekhar Bhansali, anticipated PhD completion 2031, values without private family details, and a Linux side quest using CachyOS and Niri. The local LLM/Tailscale setup is explicitly in progress; the NSF direction is explicitly proposed research.

## Next additions

- Add the actual Mii image at `assets/mii.png`, then set `miiImagePath` in `script.js`.
- Add research figures, schematics, and public code links when the files are available. Existing decorative marks are not research data.
- Add screenshots and specifics of the Linux setup as it develops.
- If desired, prepare a public résumé/CV download without the phone number. Original PDFs and grant statements have not been copied into this repository.
- Review the first-person project summaries and contact email before publishing through the existing GitHub Pages workflow. Changes are local; no commit or push was made.

## Structure

- `index.html`: introduction, featured work, personality, contact call to action.
- `projects.html`: research stories, engineering projects, proposed research, and Linux side quest.
- `about.html`: values, current academic home, mentorship, and personal interests.
- `contact.html`: professional email, LinkedIn, and GitHub links.
- `blog.html`: retained future notes page, excluded from main navigation until there are posts.
- `thankyou.html`: gratitude page linked from the footer.
- `style.css`: shared palette, typography, components, mobile layouts, and reduced-motion handling.

## Design and performance

Original palette retained: sky blue `#87CEFA`, red `#D00000`, white `#FFFFFF`, green `#00AB44`, ink `#1a1a1a`. Cream serves as a quieter reading surface. Dark text sits on blue/green; red buttons use white text. Hard borders, offset shadows, and small rotations provide character without expensive rendering effects. Only brief hover movement is used; reduced-motion preferences disable it. Navigation and content work without JavaScript.

There is no build step. Two local font files are loaded with `font-display: swap`; the unused Black font is retained but not requested. Avoid adding videos, 3D engines, animation libraries, or large image files to the first screen.

## Image placeholders

Every page has reserved image spaces. The homepage Mii still uses `miiImagePath`; other slots use `portfolioImages` in `script.js`. Put assets in `assets/`, then fill in `src` and meaningful `alt` text for the matching key. An optional `caption` overrides the visible caption. Empty paths display labeled placeholders without broken-image requests. Images load lazily and retain their reserved dimensions. For a buildless/no-JavaScript implementation, replace the placeholder space directly with an `<img>` and update its caption.
