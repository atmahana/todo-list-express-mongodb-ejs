const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const date = require(__dirname + "/date.js");
const app = express();
const port = 3000;

let items = [];
let workItems = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

main().catch(err=>console.log(err));

async function main(){
  await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
}

const itemSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: "Learning JS"
});
const item2 = new Item({
  name: "Work on unfinished projects"
})
const item3 = new Item({
  name: "Read few pages of a book"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}).then((foundItems) => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
      .then(()=>{console.log('Successfully inserted default data')})
      .catch((err) => {
        console.log(err);
      });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", items: foundItems });
    } 
  }).catch((err) => {
    console.log(err);
  })
});

app.post("/", (req, res) => {
  let itemName = req.body.newItem;
  const listName = req.body.list.trim();

  const item = new Item({
    name: itemName
  });


  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).exec().then((foundList) => {
      if(foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
      } else {
        const newList = new List({
          name: listName, 
          items: [item]
        });
        newList.save();
        res.redirect("/"+listName);
      }
    }).catch((err) => {
      console.log(err);
    })
  }
});

app.post("/delete", (req, res) => {
  const itemId = req.body.delete;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(itemId)
    .then(() => {
      console.log("Item successfully removed!") 
    })
    .catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, {new: true})
    .then((foundList) => {
      res.redirect("/"+listName);
    }).catch(err => console.log(err));
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({name: customListName})
  .then((result) => {
    if(result === null){
      const list = new List({
        name: customListName,
        items: []
      });
      list.save();
      res.redirect("/"+customListName);
    }else{
      const resultName = result.name;
      res.render("list", {listTitle: resultName, items: result.items})
    }
  })
});

app.post("/work", (req, res) => {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
