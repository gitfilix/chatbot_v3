# chatbot_v3
version 3 of chatbot with chat-gpt integration for render deployment

# AI bot with Chat integration - FLX playground 

lets talk with AI with this nice UI and try out the API of openAI

# install it locally
`npm install`

# start the dev server

`npm run dev`
# build the app for production

`npm run build`

# run the app in production mode
`npm run serve`

use 'port 10000' for render production mode
use port 5173 for local development


# use render.com to deploy this project

- adding credentials from github and allow access only this project to render
- use the 'static page' option to deploy this project on render
- add the secret key to the .env file also on render for the deployment proces

# deploment of this project on render.com
(yes its still v2 but no idea where to change that, who cares anyway?)

https://flx-chatbot-v2.onrender.com/

# React + Vite + TypeScript + ChatGPT

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# what I learned during this project
- how to configure vite to work with react and with render
- how to use render to deploy a react app
- API calls to openAI API
- NEVER add the API key to a const and push it to github - github will not allow to push the API key to github!
(dont even try it as comment. no key should ever be in the code!)
- use 'build' npm script to build the app before deploy
- use 'port 10000' for render production!
- use dotenv for adding the secret key to the .env file
- use 'serve' npm script to run the app after build and add the host to the allowedHosts array
- use 'render' npm script to deploy the app
- remove the emoji-picker-library as it causes problems due the build process 
- some neat css tricks (a.k.a use aspect-ratio for layouting).
- add differnt models to the openAI API (using: gpt-3.5-turbo,  gpt-4, gpt-4.0-turbo, gpt-4.1-nano, gpt-4o-mini, gpt-4.1-mini, gpt-4.1-2025-04-14)
- use the render.com favicon generator to get a favicon for your app (with the logo of the render.com website)
- use the realfavicon generator
- work with markdown and styling with the markdown-it library
- API for reasoning models and response object different from chat- models
- reasoning model API Call structure for [OpenAPI](https://platform.openai.com/docs/guides/reasoning?api-mode=responses) 3 turns thinking. 




add this for usage of vite config for dotenv and others global variables

` const apiKey = import.meta.env || '';`

## usage of vite.config.ts

see documentation: https://vite.dev/config/

`vite.config.ts`

```
export default defineConfig({
  plugins: [react()],
  server: {
      host: true,
      strictPort: true,
      port: isProduction ? 10000: 5173,
      allowedHosts: [
        'flx-chatbot.local',
        'flx-chatbot.local:10000',
        'flx-chatbot.local:5173',
        'localhost',
        'flx-chatbot-v2.onrender.com'
      ],
  }
})
```




# to start the app
`npm run serve`

after you built it. 

# API key for openAI API

local `.env` contains the secret key for openAI API - get your own API key and pay at least 5$ if you want to use it on your own. from here: https://platform.openai.com/account/api-keys


