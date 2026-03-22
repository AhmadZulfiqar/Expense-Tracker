const express = require('express');
const app = express();
const port = process.env.PORT || 3000; 
const path = require('path');
const data = require('./models/schema');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

require('dotenv').config(); 

// Configuration for Vercel
app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// CHANGE: Using the environment variable you set in Vercel
const dbUrl = process.env.MONGO_URI || 'mongodb+srv://zulfiqar:ahmad1122@cluster0.kbl2hqm.mongodb.net/?appName=Cluster0';

// Database Connection
mongoose.connect(dbUrl)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.log("Database Connection Error:", err));
// const dbUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expenseTracker';

// // Database Connection
// mongoose.connect(dbUrl)
//     .then(() => console.log("Connected to Local MongoDB"))
//     .catch(err => console.log("Local Database Connection Error:", err));

// Routes
app.get('/', (req, res) => {
    // Automatically send users to the log instead of a text message
    res.redirect("/expenselog");
});

app.get("/addexpense", (req, res) => {
    res.render("index.ejs");
});

app.post("/addexpense", async (req, res) => {
    // Destructure based on the "name" attribute in your HTML form
    let { petrol_amount, food_amount, others_amount, petrol_desc, food_desc, others_desc } = req.body;
    
    // Map them to your Mongoose Schema fields
    let newdata = new data({ 
        petrol: petrol_amount || 0, 
        food: food_amount || 0, 
        others: others_amount || 0, 
        petrol_des: petrol_desc, 
        food_des: food_desc, 
        others_des: others_desc 
    });

    try {
        await newdata.save();
        res.redirect("/expenselog");
    } catch (err) {
        console.log("Error saving data:", err);
        res.status(500).send("Failed to save data");
    }
});

app.get("/expenselog", async (req, res) => {
    try {
        let allData = await data.find({});
        
        // Calculate the grand total of all logs
        const grandTotal = allData.reduce((sum, log) => sum + (log.totalDaily || 0), 0);
        
        res.render("dashboard.ejs", { logs: allData, grandTotal: grandTotal });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).send("Failed to retrieve data");
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
    
    // 1. Destructure the values from the form
    let { petrol_amount, food_amount, others_amount, petrol_desc, food_desc, others_desc } = req.body;
    
    // 2. Manually calculate the new total
    // We use Number() to ensure we aren't adding strings (e.g., "10" + "20" = "1020")
    const updatedTotal = Number(petrol_amount || 0) + Number(food_amount || 0) + Number(others_amount || 0);
    
    try {
        // 3. Update the document including the new totalDaily
        await data.findByIdAndUpdate(id, { 
            petrol: petrol_amount, 
            food: food_amount, 
            others: others_amount,
            petrol_des: petrol_desc, 
            food_des: food_desc,
            others_des: others_desc,
            totalDaily: updatedTotal // Manually updating the total here
        }, { runValidators: true });

        res.redirect("/expenselog");
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).send("Failed to update data");
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




// const express = require('express');
// const mongoose = require('mongoose');
// const path = require('path');
// const methodOverride = require('method-override');
// require('dotenv').config(); 

// const app = express();
// const port = process.env.PORT || 3000;
// const data = require('./models/schema');

// // 1. Configuration
// app.set('views', path.join(process.cwd(), 'views'));
// app.set('view engine', 'ejs');

// // 2. Middleware
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(methodOverride('_method'));

// // 3. Local Database Connection
// // 'dailyexpense' will be the name of your local database
// const localDbUrl = 'mongodb://127.0.0.1:27017/dailyexpense';

// mongoose.connect(localDbUrl)
//     .then(() => {
//         console.log("Connected to LOCAL MongoDB");
//         app.listen(port, () => {
//             console.log(`Server is running on http://localhost:${port}`);
//         });
//     })
//     .catch(err => {
//         console.error("Local Database Connection Error:");
//         console.error(err.message);
//         console.log("Tip: Make sure the 'MongoDB Action' service is running in your Windows Services.");
//     });

// // 4. Routes
// app.get('/', (req, res) => {
//     res.redirect("/expenselog");
// });

// app.get("/addexpense", (req, res) => {
//     res.render("index.ejs");
// });

// app.post("/addexpense", async (req, res) => {
//     try {
//         const { petrol, food, others } = req.body;
//         const newdata = new data({ petrol, food, others });
//         await newdata.save();
//         res.redirect("/expenselog");
//     } catch (err) {
//         console.error("Error saving data:", err);
//         res.status(500).send("Failed to save data");
//     }
// });

// app.get("/expenselog", async (req, res) => {
//     try {
//         let allData = await data.find({});
        
//         // Calculate the grand total of all logs
//         const grandTotal = allData.reduce((sum, log) => sum + (log.totalDaily || 0), 0);
        
//         res.render("dashboard.ejs", { logs: allData, grandTotal: grandTotal });
//     } catch (err) {
//         console.error("Fetch Error:", err);
//         res.status(500).send("Failed to retrieve data");
//     }
// });

// app.get("/editexpense/:id", async (req, res) => {
//     try {
//         const foundData = await data.findById(req.params.id);
//         res.render("edit.ejs", { log: foundData });
//     } catch (err) {
//         res.status(500).send("Failed to retrieve data for edit");
//     }
// });

// app.put("/editexpense/:id", async (req, res) => {
//     try {
//         const { petrol, food, others } = req.body;
//         await data.findByIdAndUpdate(req.params.id, { petrol, food, others });
//         res.redirect("/expenselog");
//     } catch (err) {
//         res.status(500).send("Failed to update data");
//     }
// });

// app.delete("/expenses/:id", async (req, res) => {
//     try {
//         await data.findByIdAndDelete(req.params.id);
//         res.redirect("/expenselog");
//     } catch (err) {
//         res.status(500).send("Failed to delete data");
//     }
// });


// module.exports = app;
