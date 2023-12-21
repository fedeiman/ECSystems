const tagToIdentify = "a";
const urlType = "link-url";
const mailType = "link-mailto";

//function to get tag type and more util information
function clickOrigin(e) {
  var target = e.target;
  var tag = [];
  tag.tagType = target.tagName.toLowerCase();
  tag.tagClass = target.className.split(" ");
  tag.id = target.id;
  tag.parent = target.parentNode;

  return tag;
}

//funtion to check if the user click on a link
document.body.onclick = function (e) {
  elem = clickOrigin(e);
  if (
    elem.tagType === tagToIdentify &&
    (elem.tagClass[1] === urlType || elem.tagClass[1] === mailType)
  ) {
    if (!confirm("Are you sure that you want to leave the current site?")) {
      e.preventDefault();
    }
  }
};
