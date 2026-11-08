import express from 'express';
import { MongoClient , ObjectId } from 'mongodb';
const app=express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const url = "mongodb://admin:admin123@localhost:27017/?authSource=admin";
const client = new MongoClient(url);
const dbName="booksDB";
let db;
client.connect().then(()=> {
    console.log("Connnected to MongoDB");
    db=client.db(dbName);
}).catch(err=> {
    console.log("Problem while connecting MongoDB",err);
});
//CRUD
//Create
app.post("/api/v1/books",(req,res,next)=> {
    const {title,author,category,publishedYear} = req.body;
    db.collection("books").insertOne({title,author,category,publishedYear}).then((result)=> {
        res.status(201).json({"message":"Book created successfully",data:{_id:result.insertedId, ...req.body}});
    }).catch((err)=> {
        console.log("Actual error:",err);
        err.message="Failed to create book";
        next(err);
    });
});
//read
app.get("/api/v1/books/:id",(req,res,next)=> {
    const {id} = req.params;
    if(!ObjectId.isValid(id)) {
        res.status(400).json({message:"Invalid book ID"});
    }else {
        db.collection("books").findOne({_id:new ObjectId(id)}).then((book)=> {
            if(!book) {
                res.status(404).json({message:"Books not found"});
            }else {
                res.status(200).json({message:"All books fetched successfuly", data:book});
            }
        })
        .catch((err)=> {
            err.message="Books fetching failed";
            next(err);
        });
    }
});
app.get("/api/v1/books",(req,res,next)=> {
    const {category} = req.query;
    const query=category?{category}:{};
    db.collection("books").find(query).toArray().then((books)=> {
        res.status(200).json({message:"All books fetched successfully",data:books});
    })
    .catch((err)=> {
        err.message="Failed to fetch books";
        next(err);
    });
});
//update
app.put("/api/v1/books/:id",(req,res,next)=> {
    const {id} = req.params;
    const {title,author,category,publishedYear} = req.body;
    if(!ObjectId.isValid(id)) {
        res.status(400).json({message:"Invalid book ID"});
    } else {
        db.collection("books").updateOne(
            {_id:new ObjectId(id)},{$set:{title,author,category,publishedYear}}
        ).then((result)=> {
            if(result.matchedCount===0) {
                res.status(404).json({message:"Books not found"});
            } else {
                res.status(200).json({message:"Book updated successfully"});
            }
        })
        .catch((err)=> {
            err.message="Failed to update the book";
            next(err);
        });
    }
});
//delete

app.delete("/api/v1/books/:id",(req,res,next)=> {
    const {id} = req.params;

    if(!ObjectId.isValid(id)) {
        res.status(400).json({message:"Invalid book ID"});
    } else {
        db.collection("books").deleteOne({_id:new ObjectId(id)}).then((result)=> {
            if(result.deletedCount===0) {
                res.status(404).json({message:"Books not found"});
            } else {
                res.status(200).json({message:"Books deleted successfully"});
            }
        })
        .catch((err)=> {
            err.message="Failed to delete book";
            next(err);
        });
    }
});

app.use((req,res)=> {
    res.status(404).json({message:"Routes not found"});
});
app.use((err,req,res,next)=> {
    const status = err.statusCode || 500;
    const message=err.message||"Internal server error";
    res.status(status).json({message});
});
const PORT=8080;
app.listen(PORT,()=> {
    console.log(`Server running at http://localhost:${PORT}`);
});