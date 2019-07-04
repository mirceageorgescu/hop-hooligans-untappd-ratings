function getCheckins(minId) {
  var response = UrlFetchApp.fetch("https://api.untappd.com/v4/brewery/checkins/268580?client_id=### Client ID ###&client_secret=### Client secret ###&count=512&min_id=" + minId);
  var json = JSON.parse(response.getContentText());
  return json.response;
}

function toast(checkinId) {
  var response = UrlFetchApp.fetch("https://api.untappd.com/v4/checkin/toast/" + checkinId + "?access_token=### Access token ###", {muteHttpExceptions: true});
  var json = JSON.parse(response.getContentText());
  return json.response;
}

function askForDetails(checkinId) {
  var comment = "We're constantly looking to improve our beer and we value your feedback. Could you please let us know if anything was off with it? Cheers!";
  var params = {
    method: 'post',
    muteHttpExceptions: false,
    payload: {
      comment: comment
    }
  };
  var response = UrlFetchApp.fetch("https://api.untappd.com/v4/checkin/addcomment/" + checkinId + '?access_token=### Access token ###', params);
  var json = JSON.parse(response.getContentText());
  return json.response;
}

function manualAskForDetails(){
  askForDetails(763578265);
}

function writeData() {
  var sheet = SpreadsheetApp.getActiveSheet();

  //get last checkin id
  var minId = sheet.getRange(sheet.getLastRow(), 2).getValue();

  //get checkins
  var data = getCheckins(minId);

  //revert checkin order
  var checkins = data.checkins.items.reverse();

  //write data to spreadsheet
  for (var i = 0, len = checkins.length; i < len; i++) {
    //data
    sheet.getRange(sheet.getLastRow() + 1, 1).setValue([Utilities.formatDate(new Date(checkins[i].created_at), "GMT+2", "dd/MM/yyyy HH:mm")]);
    //id
    sheet.getRange(sheet.getLastRow(), 2).setValue(checkins[i].checkin_id);
    //user
    sheet.getRange(sheet.getLastRow(), 3).setValue(checkins[i].user.user_name);
    //venue
    if(checkins[i].venue && checkins[i].venue.venue_name){
      sheet.getRange(sheet.getLastRow(), 4).setValue(checkins[i].venue.venue_name);
    }
    //beer
    sheet.getRange(sheet.getLastRow(), 5).setValue(checkins[i].beer.beer_name);
    //score
    sheet.getRange(sheet.getLastRow(), 6).setValue(checkins[i].rating_score);
    //comment
    sheet.getRange(sheet.getLastRow(), 7).setValue(checkins[i].checkin_comment);

    //toast nice checkins
    if(checkins[i].rating_score >= 4) {
      toast(checkins[i].checkin_id);
      sheet.getRange(sheet.getLastRow(), 6)
        .setBackground("#d3edd3")
        .setNote('Toasted at ' + Utilities.formatDate(new Date(), "GMT+2", "dd/MM/yyyy HH:mm"));
    }

    //ask for details on bad ratings with no comments
    if(checkins[i].rating_score > 0 && checkins[i].rating_score < 2 && checkins[i].checkin_comment === "") {
      askForDetails(checkins[i].checkin_id);
      sheet.getRange(sheet.getLastRow(), 6)
        .setBackground("#fcc9ca")
        .setNote('Commented at ' + Utilities.formatDate(new Date(), "GMT+2", "dd/MM/yyyy HH:mm"))
    }
  }
}