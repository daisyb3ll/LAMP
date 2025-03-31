# Listen: Album and Music Portfolio
SE-498-01 Software Engineering Capstone; LAMP 
## 1. contributors; 
### [Daisy Fernandez-Reyes'25]()
role: UX/UI Design Engineering, Frontend Development <br>
email: fernandezreyes@chapman.edu <br>
git: [daisyb3ll](https://github.com/daisyb3ll)
### [Rory Sullivan'25](https://www.linkedin.com/in/rory-sullivan-4bb233219/)
role: FullStack Development <br>
email: rosullivan@chapman.edu <br>
git: [rosullivan2](https://github.com/rosullivan2)
### [Sarah Yoon'25](https://www.linkedin.com/in/bizsarahyoon/)
role: Database Engineering, Backend Development <br>
email: saryoon@chapman.edu <br>
git: [sarah-yoon](https://github.com/sarah-yoon)


## 2. Project Proposal
Listen: Album and Music Portfolio, is our Software Engineering Capstone project in which we will be developing LAMP, a social media platform for album reviewing.
### Source Files
**diagrams**
- [prototype on figma](https://www.figma.com/design/RQIq3U9KWt6seeFetisxWi/LAMP-wireframe?node-id=103-66&p=f&t=snf31GjyHeRyMZOe-0)

**frontend**


**functionality**

**documentation:**
- `README.md`
- [proposal](https://docs.google.com/document/d/1efeCflBILzFNpuGcEi38ipTDPUY-ot4upD_e3uvD2qM/edit?usp=sharing)
- [feature summary](https://docs.google.com/document/d/1y50wy7NUgvRf20IATAFVhJl1Hc7k3E0xlytFx1nFC8k/edit?usp=sharing)
**database:**

### known runtime/compilaiton errors  

## 4. references; 
- [node.js and mongodb installation guide by Ijeoma Igboagu on FreeCodeCamp](https://www.freecodecamp.org/news/how-to-build-an-event-app-with-node-js/)

## 5. instructions for collaborators
### 1. clone the repository
`git clone "https://github.com/daisyb3ll/LAMP.git"`
### 2. install dependencies
before running make sure you have these installed: 
#### **Required Packages**
| Dependency | Version | Description |
|------------|---------|-------------|
| express | ^4.18.2 | Web framework for Node.js |
| mongoose | ^7.0.0 | MongoDB ODM for managing the database |
| dotenv | ^16.0.3 | Loads environment variables from `.env` |
| axios | ^1.3.4 | Handles HTTP requests to Spotify API |
| ejs | ^3.1.9 | Template engine for rendering views | 
#### install dependencies
`npm install`
### 3. create .env file
***🚨 ABSOLUTELY NEVER EVER COMMIT THIS TO GIT 🚨*** <br>
inside project root folder create file name .env <br> ***ask daisy for credential info*** <br>make sure to add it to .gitignore!
### 4. run server
`node server.js`
### 5. test api
test api by running on local machine 
`http://localhost:3000/save-top-tracks`

### project structure
project structure should look like this 
```
/LAMP
│── .vscode
    └── settings.json
│── models/             # Database schemas
│── node_modules/       # Dependencies (not committed, install)
│── public/             # Static files (CSS, JS)
│── routes              # API route handlers
│── views/              # EJS templates
│── .env                # Environment variables (ignored *dm daisy)
│── .gitignore          # Files to ignore in Git
│── package-lock.json   # locks specific versionsn of dependencies
│── package.json        # Dependency management
│── README.md           # Documentation
│── server.js           # Main server file
```

### 6. test UI
run this on the terminal: `http://localhost:3000`
