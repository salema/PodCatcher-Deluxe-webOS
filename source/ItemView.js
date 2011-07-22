enyo.kind({
  name: "Net.Alliknow.PodCatcher.ItemView",
  kind: enyo.SlidingView,
  components: [
    {kind: enyo.Header, style: "min-height: 60px;", components: [
      {kind: enyo.HFlexBox, flex: 1, components: [
         {content: "Listen", name: "selectedItemName", style: "text-overflow: ellipsis; overflow: hidden; white-space: nowrap;", flex: 1},
         {kind: enyo.Spinner, name: "feedWebViewSpinner", align: "right"}
      ]}
    ]},
    {kind: enyo.Scroller, flex: 1, components: []},
    {kind: enyo.Toolbar, pack: "justify", components: [
      {kind: enyo.GrabButton}
    ]}
  ]
}); 