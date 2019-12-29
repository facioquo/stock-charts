// this file is required for hosting on Linux Azure App Service
// to automatically start the service after deployment
// also add `npx serve -s` in startup command in Configuration
module.exports = {
    apps: [
        {
            script: "npx serve -s"
        }
    ]
};