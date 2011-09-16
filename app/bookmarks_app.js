var etv = {}
// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  MODELS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Folder Item 
etv.Entry = Backbone.Model.extend({
	urlRoot: '/api/v3.0/media/lists',

  folder_url: function(){
    folder = this.get('folder')
  },
});



// Folder model
etv.Folder = Backbone.Model.extend({

    initialize: function() {
      this.entries = new etv.Entries([],{parent_model:this});
    },

    url: function(){
      return '/api/v3.0/media/lists/'+this.get('id')
    }
    
})




// - - - - - - - - - - - - - - -- - - - -- - - - - -- - - -- - - - -- -
//----------------------  COLLECTIONS  --------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Items Collection
etv.Entries = Backbone.Collection.extend({
  initialize: function(list,options) {
      this.parent_model = options.parent_model;
    },

  model: etv.Entry,
  // to change
  url: function(){
    return '/api/v3.0/media/lists/'+this.parent_model.get('id')+'/entries'
  },

});



//  Folder Collection
etv.Folders = Backbone.Collection.extend({

	model: etv.Folder,

	url: '/api/v3.0/media/lists?ptype=1'


});








// - - -- - - -- - - -- - - -- - - - -- - - - - -- - - -- - - - -- - - 
//----------------------  VIEWS  --------------------------------------
// - - - - -- - -  - -- - -- - - - - -- - - - -- - - - - -- - - - - - -

// Single Entry view
etv.EntryView = Backbone.View.extend({
    tagName: "div",

    className: "etv-app-item",

    template: _.template(this.$('#item_template').html()),

    render: function(){
      $(this.el).html(this.template(this.model.toJSON()))
      return this
    },




});








//Single folder view
etv.FolderView = Backbone.View.extend({

	tagName: "div",

	className: "etv-app-folder",

	template: _.template(this.$('#folder_template').html()),

  events: {
      "click #.open": "folderOpen",
    },

  initialize: function(options){
    this.model.entries.bind('add', this.addOneEntry, this);
  },


  render: function(){
    	$(this.el).html(this.template(this.model.toJSON()))
    	return this
    },

  folderOpen: function(){
    this.model.entries.fetch({'success':this.addAllEntries})
  },

  addOneEntry: function(entry){
    var entry_view = new etv.EntryView({model: entry});
    $(this.el).
  },

  addAllEntries: function(model, responce){
    console.log(responce)
  }


})



// Bookmarks Main Viev 
etv.BookmarksView = Backbone.View.extend({
	initialize: function(options){
		    // bind useful methods
		    this.folders = new etv.Folders()
		    this.folders.bind('add', this.addOne, this);
        this.folders.bind('reset', this.addAll, this);
        this.folders.bind('all', this.render, this);
        this.folders.fetch()
        },

    addOne: function(folder){
    	var folder_view = new etv.FolderView({model: folder})
    	$(this.el).append(folder_view.render().el)
    },

    addAll: function(){
    	this.folders.each(this.addOne, this)
    }
})



















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

