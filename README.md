## Devvit Three.js Starter Experimental

https://github.com/user-attachments/assets/3023626e-ad48-43a5-bd8e-1b13920ad7e0

An experimental starter that explores a new way to build applications on Reddit's developer platform.

- [Devvit](https://developers.reddit.com/): A way to build and deploy immersive games on Reddit
- [Vite](https://vite.dev/): For compiling the webView
- [Three.js](https://threejs.org/): For 3D animations and physics
- [Express](https://expressjs.com/): For backend logic
- [Typescript](https://www.typescriptlang.org/): For type safety

## Getting Started

### Prerequisites

> Make sure you have Node 22 downloaded on your machine before running!

```sh
npm install -g devvit

devvit login
```

1. **Create your project**

```sh
git clone https://github.com/reddit/devvit-threejs-starter-experimental YOUR_PROJECT_NAME

cd YOUR_PROJECT_NAME

npm install
```

2. **Make a subreddit**: Make a private subreddit on Reddit.com. This will be where you do your own development. Go to Reddit.com, scroll the left side bar down to communities, and click "Create a community."
3. **Update the name in package.json**: Find the `dev:devvit` command and replace `YOUR_SUBREDDIT_NAME` with the subreddit name you just created.
4. **Update yaml file**: In `devvit.yaml` replace `YOUR_APP_NAME` with the name of your app. This will be shown to users that play your app.
5. **Upload**: Run `npm run upload` and go through the prompts
6. **Playtest**: Run `npm run dev` to playtest your application in production by going to your subreddit.

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit.
- `npm run upload`: Uploads a new version of your app
- `npm run check`: Type checks, lints, and prettifies your app

## Cursor Integration

This template comes with a pre-configured cursor environment. To get started, [download cursor](https://www.cursor.com/downloads) and enable the `devvit-mcp` when prompted.

## Credits

Huge thanks to [feldhaus](https://github.com/feldhaus) for [open sourcing the tower blocks code](https://github.com/feldhaus/tower-blocks)!
