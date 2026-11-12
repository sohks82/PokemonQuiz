# Fault Finders

A Celtic 8-bit role-playing game for Computer Maintenance Chapter 4, played on phones. Students:

1. walk from Workshop Town along two routes,
2. fix faulty PCs by battling fault creatures,
3. help customers by asking the right questions,
4. win two gym badges.

A class leaderboard runs live on the projector.

- **Content:** 30 questions across 13 encounters.
  - Route 1 and the **Process Gym** cover 4.3 Troubleshooting Process.
  - Route 2 and the **Hardware Clinic** cover 4.4 Common Problems and Solutions.
  - A playthrough takes about 20–30 minutes.
- **Scoring:** a right answer on the first try is worth 100 points, the second try 50, the third 25 and any later try 10. A wrong answer costs energy and shows a hint.
  - Scores are worked out on the server.
  - Answers are shuffled for each student.
  - A student can't claim a win without answering every question in that battle.
- **Saving:** progress saves automatically. Students who refresh or switch phones carry on where they were.
- **Music:** off by default. Students switch it on with the ♪ button, ideally with earphones. Six slots (title, town and routes, battle, Gym 1, Gym 2, victory) play built-in Celtic 8-bit tracks until you upload your own.
- **Admin panel** (`/admin`, password-protected):
  - **Classes:** create class sessions; open, close or reset them; see results; export CSV.
  - **Questions:** edit any question, its answers, hint and explanation, or restore the originals.
  - **Music:** upload or remove your own tracks.

Built with Next.js 15 and Postgres (Neon). Music files are stored in Vercel Blob. Deployed on Vercel.

---

## Deploy it (about 20 minutes)

This works like Troubleshooter Tiles, plus one extra step for music storage. Use a **new** GitHub repo, a **new** Vercel project and a **new** Neon database, so the two games stay separate.

### 1. Put the code on GitHub

1. Unzip `fault-finders.zip`.
2. On github.com, click **+ > New repository**. Name it `fault-finders`, make it **Private**, and click **Create repository**.
3. Click **uploading an existing file**.
4. Drag **everything inside** the unzipped folder into the upload area: the `app`, `components` and `lib` folders and all the files. Don't drag the folder itself.
5. Click **Commit changes**.

### 2. Import it into Vercel

1. On vercel.com, click **Add New… > Project**, then **Import** next to `fault-finders`. Vercel detects Next.js.
2. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | Your admin password |
   | `SESSION_SECRET` | Any long random text |

3. Click **Deploy**.

### 3. Add the database (Neon)

1. In the project, open **Storage > Create Database > Neon**. Pick **Singapore**.
2. Connect it to `fault-finders`. Vercel adds `DATABASE_URL`.

### 4. Add music storage (Vercel Blob)

You only need this to upload your own music. The built-in music works without it.

1. In **Storage**, click **Create Database > Blob**.
2. Connect it to `fault-finders`. Vercel adds `BLOB_READ_WRITE_TOKEN`.

### 5. Redeploy

Go to **Deployments**, open the **⋯** menu on the latest deployment, and click **Redeploy**. New settings only apply after a redeploy.

### 6. Check it works

1. Open `https://<your-project>.vercel.app/admin` and log in.
2. Create a class session and click **Open to students**.
3. Click **Try as a student** and play the first battle.
4. Click **Open leaderboard** to see your score.

---

## Running a class

1. **Before class:** create a session for the class in `/admin`. Check the questions if you've edited them.
2. **Start:** click **Open to students** and put **Open leaderboard** on the projector. It shows the website address and the code.
3. **Students** go to the site, enter the code and their name, then tap **Start**. Rowan, the town technician, explains the controls and the goal. The **START** button in the game shows the next goal, their score and the sound settings.
4. **End:** click **Close session**. Play stops and the leaderboard stays. **Export CSV** gives each student's score, badges, encounters cleared, correct answers and wrong tries.
5. **Next class:** create a new session to keep results separate, or use **Reset scores**.

## Your own music

- Open **Admin > Music** and upload an MP3 for any slot (under 4 MB each; 128 kbps is plenty). **Remove** puts the built-in track back.
- Only upload music you made or are allowed to use.
- Students hear new tracks the next time they load the game.

## Controls

- **Phone:** the on-screen D-pad, **A** (talk, inspect, continue), **B** (back) and **START** (menu).
- **Keyboard:** arrow keys or WASD to move, **Z/Space/Enter** for A, **X** for B, **Esc** or **M** for the menu, and **1–4** to pick answers in battle.

## Project layout

```
app/play/[code]/      The game
app/board/[code]/     Live leaderboard
app/admin/...         Admin: classes, questions, music
app/api/s/[code]/...  Player API: game, join, answer, progress, board
app/api/admin/...     Admin API
components/game/      Engine, pixel art and the chiptune music engine
lib/world.js          Maps, characters, encounters, gates
lib/questions.js      The 30 default questions
lib/play.js           Scoring, progress checks, leaderboard
lib/db.js             Postgres; creates the tables and questions on first run
```

## Run it locally (optional)

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
npm run dev
```
