// Main podcatcher kind, manages control flow 
enyo.kind({
  name: "Net.Alliknow.PodCatcher",
  kind: enyo.VFlexBox,
  components: [
    {kind: "PageHeader", components: [
      {kind: enyo.VFlexBox, content: "Yet Another Simple Pod Catcher", flex: 1}
    ]},
    {kind: "SlidingPane", flex: 1, multiViewMinWidth: 480, onSelect: "paneSelected", name: "feedSlidingPane",
      components: [
        {kind: "Net.Alliknow.PodCatcher.FeedList", name: "feedListPane", width: "320px", 
          onListTap: "showFeed", onNewFeedTap: "showAddNewFeedPopup"},
        {kind: "Net.Alliknow.PodCatcher.FeedItemList", name: "feedItemListPane", width: "320px", peekWidth: 50,
          onListTap: "openFeedItem", onRefreshTap: "refreshFeedItemsList"},
        {kind: "Net.Alliknow.PodCatcher.ItemView", name: "feedItemViewPane", flex: 1, peekWidth: 100,
          onResize: "resizeWebView"}
     ]}
  ]   
});