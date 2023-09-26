# 🚀 Our Site is Live! https://www.edhtop16.com 🚀

> ⚡ Our team of developers are still working hard to push out new features!

# 🌸 cEDH Top 16 🌸

> Website for aggregating cEDH tournament data

## ⌨️ Developers and Mentors:

```
Frontend, UI/UX, Functionality: @g00gol, @znayer

Backend, custom APIs, Python Scripting: @JasonQiu21

Mentor, API Keys, DB Access: Zain and the Eminence Team
```
## How to Contribute
After cloning this repository, contact Jason for instructions on building the database. Becasue we rely on external APIs, our database update scripts don't work as-is. We're working on a script to pull form the EDHTop16 main database.

### Start Backend
[`server/`](/server/)
```
cd ./server/
pip install -r ./requirements.txt
uvicorn main:app --reload
```

### Start Frontend
[`client/`](/client/)
```
cd ./client/
npm install
npm run dev
```

When submitting pull requests, please inform us if you've added any new packages and update the corresponding package lock files.
