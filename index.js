const express = require('express');
const app = express();
const port = process.env.PORT || 3000; 
const path = require('path');
const data = require('./models/schema');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const User = require('./models/user');

require('dotenv').config(); 

// Configuration for Vercel
app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expenseTracker';

let TempUserId = null; // Global placeholder for user identification

// Database Connection
mongoose.connect(dbUrl)
    .then(() => console.log(`Successfully connected to Database: ${dbUrl.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`))
    .catch(err => console.error("Database Connection Error Details:", err));

// --- ROUTES ---

app.get('/', (req, res) => {
    res.redirect("/user");
});

// Render the Find Tracker Search Page
app.get("/find-tracker", (req, res) => {
    res.render("findTracker.ejs", { error: null });
});

// Handle the Email Search Form Submission
app.post("/find-tracker", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.render("findTracker.ejs", { 
                error: "No tracker found with that email address. Try again or create a new profile." 
            });
        }
        
        TempUserId = user._id; // Store the user ID globally
        
        let allData = await data.find({ userId: TempUserId });
        const grandTotal = allData.reduce((sum, log) => sum + (Number(log.totalDaily) || 0), 0);
        let userName = user.name || "User";
        res.render("dashboard.ejs", { logs: allData, grandTotal: grandTotal, user: user });
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).send("An error occurred while searching for your tracker.");
    }
});

// Render User Form
app.get("/user", (req, res) => {
    res.render("user.ejs");
});

// Handle User Submission
app.post("/user", async (req, res) => {
    const { name, email } = req.body;
    try {
        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            user = new User({ name: name, email: normalizedEmail });
            await user.save();
        }
        
        TempUserId = user._id; // FIX: Set global ID for brand new registered users too!
        res.redirect("/expenselog");
    } catch (err) {
        console.error("Error saving user details:", err);
        res.status(500).send(`Failed to save user: ${err.message}`);
    }
});

// Expense Log route (Uncommented and fixed so page redirection redirects properly)
app.get("/expenselog", async (req, res) => {
    try {
        let allData = await data.find({ userId: TempUserId });
        let user = await User.findById(TempUserId);
        const grandTotal = allData.reduce((sum, log) => sum + (Number(log.totalDaily) || 0), 0);
        
        console.log(user,allData,grandTotal);

        res.render("dashboard.ejs", { 
            logs: allData, 
            grandTotal: grandTotal,
            user: user
        });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).send(`Failed to retrieve data: ${err.message}`);
    }
});

app.get("/addexpense", (req, res) => {
    res.render("index.ejs");
});

app.post("/addexpense", async (req, res) => {
    let { petrol_amount, food_amount, others_amount, petrol_desc, food_desc, others_desc } = req.body;
    
    let petrolNum = Number(petrol_amount) || 0;
    let foodNum = Number(food_amount) || 0;
    let othersNum = Number(others_amount) || 0;
    let calculatedTotal = petrolNum + foodNum + othersNum;

    let newdata = new data({ 
        userId: TempUserId, // FIX: Save tracking records linked to your global id variable
        petrol: petrolNum, 
        food: foodNum, 
        others: othersNum, 
        petrol_des: petrol_desc, 
        food_des: food_desc, 
        others_des: others_desc,
        totalDaily: calculatedTotal 
    });

    try {
        await newdata.save();
        
        // Use your clean /expenselog redirect structure instead of manually rendering dashboards here
        res.redirect("/expenselog");
    } catch (err) {
        console.error("Error saving data to DB:", err);
        res.status(500).send(`Failed to save data: ${err.message}`);
    }
});

app.get("/editexpense/:id", async (req, res) => {
    let { id } = req.params;
    try {
        let foundData = await data.findById(id);
        res.render("edit.ejs", { log: foundData });
    } catch (err) {
        res.status(500).send("Failed to retrieve data for edit");
    }
});

app.put("/editexpense/:id", async (req, res) => {
    let { id } = req.params;
    let { petrol_amount, food_amount, others_amount, petrol_desc, food_desc, others_desc } = req.body;
    
    const petrolNum = Number(petrol_amount) || 0;
    const foodNum = Number(food_amount) || 0;
    const othersNum = Number(others_amount) || 0;
    const updatedTotal = petrolNum + foodNum + othersNum;
    
    try {
        await data.findByIdAndUpdate(id, { 
            petrol: petrolNum, 
            food: foodNum, 
            others: othersNum,
            petrol_des: petrol_desc, 
            food_des: food_desc,
            others_des: others_desc,
            totalDaily: updatedTotal 
        }, { runValidators: true, new: true });

        res.redirect("/expenselog");
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).send(`Failed to update data: ${err.message}`);
    }
});

app.delete("/expenses/:id", async (req, res) => {
    let { id } = req.params;
    try {
        await data.findByIdAndDelete(id);
        res.redirect("/expenselog");
    } catch (err) {
        res.status(500).send("Failed to delete data");
    }
});

// Local Server Start
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

module.exports = app;
