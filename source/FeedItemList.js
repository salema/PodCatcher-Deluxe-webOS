enyo.kind({
  name: "Net.Alliknow.PodCatcher.FeedItemList",
  kind: enyo.SlidingView,
  layoutKind: enyo.VFlexLayout,
  components: [
    {kind: enyo.Header, style: "min-height: 60px;", layoutKind: enyo.HFlexLayout, components: [
      {content: "Select", name: "selectedFeedName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
      {kind: enyo.Spinner, name: "feedItemsSpinner", align: "right"}
    ]},
    {kind: enyo.Scroller, flex: 1, components: []},
    {kind: enyo.Toolbar, pack: "justify", components: [
      {kind: enyo.GrabButton}
    ]}
  ]
}); 