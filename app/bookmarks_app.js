var etv = {}; etv.vid = {}; etv.vid.bmark = {}
// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  MODELS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Folder Item 
etv.vid.bmark.Entry = Backbone.Model.extend({
	urlRoot: '/api/v3.0/media/lists',
  });



// Folder model
etv.vid.bmark.Folder = Backbone.Model.extend({

    initialize: function() {
      this.children = new etv.vid.bmark.Entries([],{parent_model:this});
    },

    url: function(){
      return '/api/v3.0/media/lists/'+this.get('id')
    }
    
});


// - - - - - - - - - - - - - - -- - - - -- - - - - -- - - -- - - - -- -
//----------------------  COLLECTIONS  --------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Items Collection
etv.vid.bmark.Entries = Backbone.Collection.extend({

  initialize: function(list,options) {
      this.parent_model = options.parent_model;
    },

  model: etv.vid.bmark.Entry,

  // to change
  url: function(){
    return '/api/v3.0/media/lists/'+this.parent_model.get('id')+'/entries'
  },

});



//  Folder Collection
etv.vid.bmark.Folders = Backbone.Collection.extend({

	model: etv.vid.bmark.Folder,

	url: '/api/v3.0/media/lists?ptype=1'

});



// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  VIEWS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -


//Base View class with common methods to extend in future views 
etv.vid.bmark.BaseView = Backbone.View.extend({

   childrenClassName: 'child_container',

   initialize: function(attrs, options){
        this.el = $(this.el)
        this.children_container = $(this.make("div", {className: this.childrenClassName}))
        this.children = new this.collection_class([],{'parent_model':this.model})
        this.children.bind('reset', this.addAll, this);
        this.children.bind('add', this.addOne, this);
   },

   addOne: function(model){
      var children_view = new this.childrens_view({model: model})
      $(this.children_container).append(children_view.render().el)
    },

   addAll: function(){
      this.children.each(this.addOne, this)
      this.el.append(this.children_container)
    },


  //this method uses only perent 
  render: function(){
      $(this.el).html(this.template(this.model.toJSON()))
      return this
    }

});


// Single Entry view
etv.vid.bmark.EntryView = etv.vid.bmark.BaseView.extend({

    tagName: "div",

    className: "etv-app-items",

    template: _.template(this.$('#item_template').html()),

    initialize: function(){
         etv.vid.bmark.Entries.bind('reset', this.addAll, this);
     }
});




//Single folder view
etv.vid.bmark.FolderView = etv.vid.bmark.BaseView.extend({

  opend: false,

  childrenClassName: 'children_container',

  collection_class: etv.vid.bmark.Entries,

  childrens_view: etv.vid.bmark.EntryView,
 
  tagName: "div",

  className: "etv-app-folder",

  template: _.template(this.$('#folder_template').html()),

  events: {
      "click #.open": "folderToggle",
      "click #.remove": "removeFolder",
    },

  folderToggle: function(){
    if (!this.opend) {
        this.children.fetch({success: this.openFolder()})
      }
    else {
      this.closeFolder()
    }
  },

  openFolder : function(){
    this.el.find('.open').html('CLOSE')
    this.opend = true
  },

  closeFolder: function(){
    this.el.find('.open').html('OPEN')
    this.opend = false
    this.children_container.html('')
  },

  removeFolder: function(){
    this.el.remove();
    this.model.destroy()
  }
});




// Bookmarks Main Viev 
etv.vid.bmark.BookmarksView = etv.vid.bmark.BaseView.extend({

  collection_class : etv.vid.bmark.Folders,

  childrens_view: etv.vid.bmark.FolderView,

  initialize: function(attributes,options){
        etv.vid.bmark.BaseView.prototype.initialize.call(this, attributes, options);
        this.children.fetch()
    }

});














// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  DOC  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -



// /api/v3.0/media/lists?ptype=1
// [
   // {
   //     "updated": "2011-09-13 13:41:23",
   //     "description": "",
   //     "created": "2011-09-13 13:41:23",
   //     "items": 1,
   //     "title": "Test",
   //     "ptype": 1,
   //     "user": {
   //         "username": "api"
   //     },
   //     "duration": 0,
   //     "shared": false,
   //     "id": 1
   // },
//    {
//        "updated": "2011-09-13 13:41:23",
//        "description": "",
//        "created": "2011-09-13 13:41:23",
//        "items": 0,
//        "title": "Test1",
//        "ptype": 1,
//        "user": {
//            "username": "api"
//        },
//        "duration": 0,
//        "shared": false,
//        "id": 2
//    }
// ]

// /api/v3.0/media/lists/1
// {
//    "updated": "2011-09-13 13:42:34",
//    "description": "",
//    "created": "2011-09-13 13:42:34",
//    "items": 1,
//    "title": "Test",
//    "ptype": 1,
//    "user": {
//        "username": "api"
//    },
//    "duration": 0,
//    "shared": false,
//    "id": 1
// }
// 1:45 PM
// /api/v3.0/media/lists/1/entries
// [
//    {
//        "media": {
//            "name": "Interny",
//            "description_full": null
//        },
//        "playlist": {
//            "updated": "2011-09-13 13:45:34",
//            "description": "",
//            "created": "2011-09-13 13:45:34",
//            "items": 2,
//            "title": "Test",
//            "ptype": 1,
//            "user": {
//                "username": "api"
//            },
//            "duration": 0,
//            "shared": false,
//            "id": 1
//        },
//        "added": "2011-09-13 13:45:34",
//        "order": 0
//    },
//    {
//        "media": {
//            "name": "Interny2",
//            "description_full": null
//        },
//        "playlist": {
//            "updated": "2011-09-13 13:45:34",
//            "description": "",
//            "created": "2011-09-13 13:45:34",
//            "items": 2,
//            "title": "Test",
//            "ptype": 1,
//            "user": {
//                "username": "api"
//            },
//            "duration": 0,
//            "shared": false,
//            "id": 1
//        },
//        "added": "2011-09-13 13:45:34",
//        "order": 1
//    }
// ]

