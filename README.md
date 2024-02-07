# Horizon Server Manager



## What is it?

Horizon CS Server Manager is an all-in-one solution for running multiple Source-based tournament servers - especially at LAN events.

Source servers' out-the-box functionality is straight-forward and efficient. Great for getting games played, but when you're overseeings 80 teams playing on 40 seperate servers life gets a little tricky; no way to see how far along games are, reliance on players asking for assistance through communication platforms or in-person, having to remember and double-check dozens of cvars and rcon commands to fix problems or execute round-backups -- all of these are huge barriers to entry for new admin talent and even just the efficient running of a tournament.

In the past there have been tools to assist in a similar manner - HLSW has been a mainstay for decades however it hasn't received an update since 2011 and is nearly impossible to find from trusted sources. It was also incredibly difficult to use and was designed for managing a handful of public servers, rather than supporting a micro-managed tournament environment.

eBot and other similar platforms are incredibly heavy-duty and often only support pre-determined matchups, with little support for dynamic server assignment, additionally they often require physical installation onto server boxes or deep integration into the server itself.

Horizon Server Manager is lightweight, integrating with gameservers entirely via UDP communication rather than adding overheads. A comprehensive toolbox for making large-scale tournaments manageable, designed and written by one of the most experienced CS admins in the industry, featuring all the tools you'll ever need - and some you never knew you did.

## Getting it up and running

Process for booting booting the project in its current state --

Install npm packages, and build the project.

npm dev script will boot the HTTP and UDP servers, and load the WebSocket and Emitters at the same time - front-end is served via http port 8080, UDP traffic is being listened to on port 12345.

The project is currently using a local postgres instance to store data 'permanently' between sessions, which the front-end pulls from when the pages are loaded. Haven't containerised this yet, sorry!

"npm run send" will send simulated dummy-data from real CS matches from a series of ports between 50000-50019 (customisable) which will update the database and also sends the partial updates to all connected WebSocket clients.

Front end listens for the WebSocket message type to determine whether to update the whole server list or to find which specific gameserver just sent an update, and apply that!

Front-end catches all the server info from [here](https://github.com/dredwerkz/Horizon-CS-Server-Manager/blob/dbccf38c4fa0c8f03be0cb08440c61ee25951c27/src/components/ServerContainer/ServerContainer.jsx#L12) at the moment! I probably need to elevate this once I start working on the control panel, though.

## Table of Contents

-   [What is it?](#what-is-it)
-   [Technologies Used](#technologies-used)
-   [Features](#features)
-   [Screenshots](#screenshots)
-   [Development Process](#development-process)
-   [Challenges and Learnings](#challenges-and-learnings)
-   [Future Scope and Enhancements](#future-scope-and-enhancements)
-   [License](#license)
-   [Contact](#contact)

## Technologies Used

-   React: The web-panel is written entirely in React with accompanying CSS files for each individual component for maximum versatility. React allows for efficient re-rendering of components based on live updates from servers, and streamlined management of state & data flow between the web-panel and the live game-servers.

-   JavaScript: Keeping front and back consistent in terms of language just makes sense - JS supports most of the tools needed for this app out of the box and makes setting up an accessible, easy-to-deploy front-end a cinch at events.

-   WebSocket: Establishing connections via WebSocket is an obvious choice for updating admin panels as soon as updates come through, triggering relevant fetch requests for the latest up-to-date info in an efficient and responsive manner.

-   PostgreSQL: Storing server data in a SQL database makes persistent server data easy and reliable, especially in an environment handling rapid fire requests where constant read/writing of JSON storage may become a failure point.

-   Express: A minimal and flexible Node.js web application framework that provides a robust set of features for an application like this. In this project, Express is used to set up the server and API, facilitating the communication between the front-end, the database, and the gameservers - handling UDP consumption and sending RCON traffic back to the gameservers.

## Features

* Automatic serverlist tracking

* Live gamestate updates - teams, maps, scores

* Live help request notifications

* Quick IP;Password info to clipboard

* Common server command hotkeys (one-click pause, restart, sourcemod commands)

* Round backup system integration AKA 'Match Medic' (full-proof round selection based on live match status)

* Optional server chat-log backups

* In-built Source RCON Protocol terminal

* RCON Broadcasting

* PugSetup mode (Server listens for PugSetup specific events for better info management)

## Screenshots

![Screenshot of the server status panel, with several servers listed, IPs, game scores, and maps included. One server is flashing yellow to indicate that a player has requested admin support.](https://i.imgur.com/6Sv7nKS.png)

## Development Process

With this project scheduled for deployment at Insomnia72 there's a solid deadline for features and testing in a ready-to-deploy state, making an agile development cycle perfect for this project.

Consistent sprints with clear goals in mind to deliver a functional MVP each deployment, with refinements and new features added over time to ensure that the app is stable, reliable, and ready for action whenever the need arises.

## Challenges and Learnings

A big challenge with a project like this is always going to be managing things out of your control - the nature of working with 3rd party systems like gameservers, and networking elements like UDP means documentation and rigorous testing is incredibly important.

Learning how to manage such a huge influx of information over the internet, and efficiently categorise, route and manage that data has been a challenge, and there's always room for improvement. As this app is deployed in environments with greater and greater numbers of servers, efficient and reliable code becomes more and more important. 

## Future Scope and Enhancements

* Convert project to Vite over CRA - the quick and easy methods didn't work so I'll have to do this by hand at some point soon...

* Security features - currently there's no sanitisation of output to the servers

* Dynamic server management - being able to input Steam IDs and have the admin panel auto-manage servers based on which players are in server would open up a number of possibilities, such as automatic team naming or automatic score submissions.

* DatHost api integration for automatic server tracking

## License

[MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

## Contact

Feel free to contact me on here, or if LinkedIn's your thing, [find me here!](https://www.linkedin.com/in/jon-kelly-esports/)
