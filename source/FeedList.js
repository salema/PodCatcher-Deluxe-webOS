// Show all feeds
enyo.kind({
  name: "Net.Alliknow.PodCatcher.FeedList",
  kind: enyo.SlidingView,
  layoutKind: enyo.VFlexLayout,
  components:[
    {kind: "Net.Alliknow.PodCatcher.AddFeedPopup", name: "addFeedPopup"},
    {kind: enyo.Header, style: "min-height: 60px;", name: "feedListHeader", content: "Discover"},
    {kind: enyo.Scroller, flex: 1, components: [
      {kind: enyo.VirtualRepeater, name: "feedList", onSetupRow: "getFeed", components: [
        {kind: enyo.SwipeableItem, onConfirm: "deleteFeed", layoutKind: enyo.HFlexLayout, tapHighlight: true, onclick: "highlight", components: [
          {name: "listItemTitle", content: ""}
        ]}
      ]}
    ]},
    {kind: enyo.Toolbar, pack: "justify", components: [
      {kind: "Button", content: "Add", onclick: "addFeed"},
      {kind: "Button", content: "Delete", onclick: "deleteFeed"}
    ]}
  ],
  
  ready: function() {
    this.feedList = localStorage.getItem("feedList");
     
    if (this.feedList == undefined) {
      this.feedList = [];
      this.feedList.push({
             title: "Linux Outlaws",
             url: "???"
         });
    } else {
      this.feedList = JSON.parse(this.feedList);
      this.$.feedList.render();
    }
  }, 
  
  getFeed: function(inSender, inIndex) {
    var feed = this.feedList[inIndex];
     
    if (feed) {
      this.$.listItemTitle.setContent(feed.title);
      return true;
    }
  },
  
  highlight: function(inSender, inEvent) {
    // TODO How to highlight an item?
  },
  
  addFeed: function() {
    this.$.addFeedPopup.openAtCenter();
  },
  
  deleteFeed: function(inSender, inIndex) {
     this.feedList.splice(inIndex, 1);
     this.$.feedList.render();
  }
}); 