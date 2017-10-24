// Things to fix/change
// 
// Rotate hair
// Make controls easier to use
// More Hairz
// Fix orientation of loaded pictures
//

// Layouts
var homelay, openlay, oboutlay, camlay, hairlay;
// Hair movement
var zoomingHair = false,draggingHair = false,renderLoopId;
// Canvas
var canvasHeight, canvasWidth;
// Pinching detection
var lastdist;
// For drawing the final image
var background, hair, canvas;
// Path to the file
var filePath, snapFolder;

// Navigation
var lastpage, currentpage = homelay;

// Two points in 2D space
function Point(x,y) {
    this.x = x;
    this.y = y;
}

// Represents a rectangle
function Rect(left, top, right, bottom)
{
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    
    this.width = function() {
        return this.right - this.left;
    }
    
    this.height = function() {
        return this.bottom - this.top;
    }
    
    this.Centre = function() {
        var centre = new Point(0,0);
        centre.x = this.left + (this.width() / 2);
        centre.y = this.top + (this.height() / 2);
        
        return centre;
    }
}

// Represents the background image
function Background(img) {
    this.img = img;
    this.imgAspectRatio = img.GetAbsWidth() / img.GetAbsHeight();
    this.revImgAspectRatio = img.GetAbsHeight() / img.GetAbsWidth();
    
    if (canvasHeight > canvasWidth) {
        this.height = 1;
        this.width = ((this.height * canvasHeight) / this.revImgAspectRatio) / canvasWidth;
    } else {
        this.width = 1;
        this.height = ((this.width * canvasWidth) / this.imgAspectRatio) / canvasHeight;
    }
    this.Draw = function() {
        canvas.DrawImage(this.img,0,0,this.width,this.height,0);
    }
}

// Represents the hair
function Hair(img) {
    this.img = img
    this.imgAspectRatio = img.GetAbsWidth() / img.GetAbsHeight();
    this.position = new Point(0.0,0.0);
    // How much to add/remove from the size while zooming
    var zoomStep = 0.05;
    // This is as small as the image will get
    var minWidth = 0.005;
    
    this.width = 0.5;
    this.height = ((this.width * canvasWidth) / this.imgAspectRatio) / canvasHeight;    
    
    // The rectangle that represents the bounds of the hair
    this.Rect = function() {
        var rect = new Rect(0,0,0,0);
        rect.left = this.position.x;
        rect.top = this.position.y;
        rect.right = rect.left + this.width;
        rect.bottom = rect.top + this.height;
        
        return rect;
    }
    
    // Make the image bigger (wider)
    this.IncrWidth = function() {
        this.width += zoomStep;
        this.height = ((this.width * canvasWidth) / this.imgAspectRatio) / canvasHeight;
    }
    
    // Make the image smaller (narrower)
    this.DecrWidth = function() {
        if (this.width - zoomStep > minWidth) {
            this.width -= zoomStep;
            this.height = ((this.width * canvasWidth) / this.imgAspectRatio) / canvasHeight;
        }
    }
    
    // Get the center of the image
    this.Centre = function() {
        return this.Rect().Centre();
    }
    
    // Set the center of the image
    this.SetCentre = function(centre) {
        this.position.x = centre.x - (this.Rect().width() / 2);
        this.position.y = centre.y - (this.Rect().height() / 2);        
    }
    
    // Draw the image on the canvas
    this.Draw = function(canvas) {
        canvas.DrawImage(this.img,this.position.x,this.position.y,this.width,this.height,0);
    }
}


//Called when application is started.
function OnStart()
{   
    app.SetOrientation( "portrait" );
    app.EnableBackKey(false);

    // Home Layout
    homelay = app.CreateLayout( "Linear", "Vertical,FillXY,VCenter" );
    homelay.SetBackColor( "green" )
    currentpage = homelay;
    
    var logo = app.CreateImage( "Img/logo1" )
    homelay.AddChild( logo )
    
    btn = app.CreateButton( "Click here to start!" );
    btn.SetOnTouch(open_open)
    homelay.AddChild( btn );

    app.AddLayout( homelay );
    
    // Open Screen
    openlay = app.CreateLayout( "Linear", "Vertical,FillXY,VCenter" );
    openlay.SetVisibility( "hide" );
    openlay.PrevPage = homelay;
    var logo2 = app.CreateImage( "Img/logo2" )
    app.AddLayout( openlay );
    openlay.SetBackColor( "green" )
   
    // About layout
    aboutlay = app.CreateLayout( "Linear", "Vertical,FillXY,VCenter" ); 
    aboutlay.SetVisibility("hide");
    aboutlay.PrevPage = openlay;
    app.AddLayout(aboutlay);
    //Create a text label and add it to layout.
    txt = app.CreateText( "This fanctastic app will photoshop Donald J Trump's hair onto your own selfies or pictures! Sort notice, this was made for a UK prodject by 12-year-olds for joke purposes only.\nYou may choose to take a photo and add the hair on or choose a photo from your gallery. If you want you can share the photo ot save it onto your phone. Enjoy!",1,-1,"Multiline" )
	txt.SetTextColor("red")
	txt.SetTextSize(15);
	aboutlay.AddChild(txt)
	var back = app.CreateButton( "back" );
	back.SetOnTouch(function () { openlay.Animate("SlideFromLeft"); aboutlay.SetVisibility("hide"); currentpage=openlay; lastpage=aboutlay });
	aboutlay.AddChild(back)
	aboutlay.SetBackColor( "green" )
	
	openlay.AddChild(logo2);
	btn = app.CreateButton( "about" )
	btn.SetOnTouch(about_open)
	openlay.AddChild( btn );
	
    btn = app.CreateButton( "camera" );
    btn.SetOnTouch(cam_open)
    openlay.AddChild( btn );
    app.AddLayout( openlay );
    
    btn = app.CreateButton( "gallery" )
    btn.SetOnTouch(Gallery_Open)
    openlay.AddChild( btn );
    app.AddLayout( openlay );


	//Camera Screen
	camlay = app.CreateLayout( "Linear", "Vertical,FillXY,HCenter" );
    camlay.PrevPage = openlay;
    var viewlay = app.CreateLayout("Linear","Vertical,FillXY");
    viewlay.SetSize(1.0,0.8);
    camlay.AddChild(viewlay);
    camlay.SetSize(1.0,1,0);
    var bottomlay = app.CreateLayout("Linear","Vertical,FillXY");
    bottomlay.SetBackColor("black");
    camlay.AddChild(bottomlay);
	//Create camera view control.
	cam = app.CreateCameraView( 1, 0.8 );
	viewlay.AddChild( cam );  		
	
	// If there are multiple cameras, create a button to use the selfie cam
	if (cam.GetCameraCount() > 1) {
	    var selfieBtn = app.CreateButton("Switch to Selfie");
	    selfieBtn.SetOnTouch(function () { 
	        viewlay.RemoveChild(cam);
	        cam.Destroy();
	        if (this.IsOnSelfie == undefined || !this.IsOnSelfie) {
	            cam = app.CreateCameraView(1,0.8,"Front");
	        } else {
	            cam = app.CreateCameraView(1,0.8,);
	        }
	        viewlay.AddChild(cam);
	        setTimeout(cam.StartPreview,200);
	        if (this.IsOnSelfie == undefined || !this.IsOnSelfie) {
	            selfieBtn.SetText("Switch to Rear");
	        } else {
	            selfieBtn.SetText("Switch to Selfie");
	        }
	        this.IsOnSelfie = !this.IsOnSelfie;
	    });
	    bottomlay.AddChild(selfieBtn);
	}
	
	//Create shutter button.
	btn = app.CreateButton( "Snap!");
	btn.SetOnTouch( btn_TakePic );
	bottomlay.AddChild( btn ); 
    camlay.SetVisibility("Hide");	
	app.AddLayout(camlay);
	
	//Create a folder for snaps.
	var sdCard = "/sdcard";
	app.Debug(sdCard);
	snapFolder = sdCard+"/Harz";
	app.MakeFolder( snapFolder );
	
	hairlay = app.CreateLayout("Linear","Vertical,FillXY");
	hairlay.SetVisibility("Hide");
	app.AddLayout(hairlay);
	
}

//Handle shutter button.
function btn_TakePic()
{   //Take a picture and store to sdcard.
    var imgHeight = cam.GetImageHeight();
    var imgWidth = cam.GetImageWidth();
    app.Debug(imgHeight+","+imgWidth);
	cam.TakePicture( snapFolder + "/tmp.jpg" );
	app.ShowProgress("Taking pic");
	cam.SetOnPicture(function(file) {
	    if(app.FileExists(file)) { 
	        app.HideProgress();
	        hairlay.Animate("SlideFromLeft");
	        camlay.SetVisibility("hide");
	        currentpage=hairlay;
	        lastpage=camlay;
	        make_hair(file);
	    } else {
	        app.ShowPopup("Picture not taken. Please try again");
	    }
	});
}


function cam_open() {
    camlay.Animate("SlideFromLeft");
    openlay.SetVisibility("Hide");
    lastpage = openlay;
    currentpage=camlay;
    cam.StartPreview();
    if(app.FileExists(snapFolder+"/tmp.jpg")) {
        app.DeleteFile(snapFolder+"/tmp.jpg");
    }
}  

function Gallery_Open() {
 app.ChooseFile( "choose an image", "image/*",make_hair);
}

function open_open() {
    openlay.Animate("SlideFromLeft")
    lastpage = homelay;
    currentpage=openlay
    homelay.SetVisibility( "hide" )
}

function about_open() {
    openlay.SetVisibility( "hide" )
    lastpage = openlay;
    currentpage = aboutlay;
    aboutlay.Animate("SlideFromLeft");
}

function make_hair(pic) {
    openlay.SetVisibility("Hide");
    camlay.SetVisibility("Hide");
    app.Debug(pic)
    if (!app.FileExists(pic) ) {
        app.ShowPopup(pic+" does not exist!");
        cam_open();
        return;
    }
    hairlay.Animate("SlideFromLeft");
    currentpage = hairlay;
    hairlay.RemoveChild(canvas)
    if(this.saveBtn) hairlay.RemoveChild(this.saveBtn);
    if(this.shareBtn) hairlay.RemoveChild(this.shareBtn);
    
    var b = app.CreateImage(pic);
    var displayAspectRatio = app.GetDisplayWidth() / app.GetDisplayHeight();
    var revAspectRatio = app.GetDisplayHeight() / app.GetDisplayWidth();
    canvasWidth = b.GetAbsWidth();
    canvasHeight = b.GetAbsHeight();
    var width = 1.0;
    var height = 0.8;
    if (canvasHeight > canvasWidth) {
        width = -1;
    } else {
        height = -1;
    }
    // Creates the "canvas" which will be our final image once all is said and done
    canvas = app.CreateImage(pic, width, height, "fix", canvasWidth, canvasHeight);
    canvas.SetColor("white");
    canvas.SetAutoUpdate(false);
    canvas.SetOnTouch(OnCanvasTouch);
    canvas.SetMaxRate(36);
    hairlay.AddChild(canvas);
    
    // The background image we're adding hair to
    background = new Background(b,1.0,1.0);
    
    // This is our hair    
    hair = new Hair(app.CreateImage("Img/harz.png"));
    
    this.saveBtn = app.CreateButton("Save Image");
    saveBtn.SetOnTouch(SaveImage);
    this.shareBtn = app.CreateButton("Share");
    shareBtn.SetOnTouch(ShareImage);
    hairlay.AddChild(saveBtn);
    hairlay.AddChild(shareBtn);
    // Start the rendering loop
    renderLoopId = setInterval(Render, 1000/10);
}

function Render() {
    // Draw the background image
    background.Draw();
    // Draw the hair on the image
    hair.Draw(canvas);
    // Update evertying
    canvas.Update();
}

// Handles the touch events for moving and sizing the hair
function OnCanvasTouch(ev) {
    if (ev.action == "Up") {
        // Not touching
        draggingHair = false;
        zoomingHair = false;
    } else if (ev.action == "Move" && ev.count == 1) {
        // Dragging with one finger only
        var hairCentre = hair.Centre();
        draggingHair = true;
        zoomingHair = false;
        hair.SetCentre(new Point(ev.x[0],ev.y[0]));
    } else if (ev.action == "Move" && ev.count == 2) {
        // Zooming, using two fingers
        
        // pinchdiff defines some space which triggers when we're officially 
        // pinching/zooming vs just wiggling fingers on the screen
        var dist,diff,pinchdiff=0.01;
        draggingHair = false;
        dist=distance(ev.x[0],ev.x[1],ev.y[0],ev.y[1]); 
        if(zoomingHair) { 
            diff=(dist-lastdist); 
            if(Math.abs(diff)>pinchdiff) { 
                lastdist=dist; 
                if(diff > 0) {
                    hair.IncrWidth(); 
                } else {
                    hair.DecrWidth();
                }
            } 
        } else { 
           zoomingHair=true; 
           lastdist=dist; 
       }
    }
}

// thanks, Pythagoras
function distance(x1,x2,y1,y2) { 
    return Math.sqrt (Math.pow(x2-x1,2)+ Math.pow(y2-y1,2)); 
} 

function SaveImage(cont) {
    var input = inputBox("Name your Harz",doSave,null,0.9);
    input.ShowWithKeyboard();
}

function doSave() {
    var name = this.GetText();
    filePath = snapFolder + "/"+name+".jpg";
    canvas.Save(filePath);
    app.ScanFile(filePath);
}

function ShareImage() {
    if (filePath == undefined) {
        filePath = snapFolder+"/tmp.jpg";
        canvas.Save(filePath);
    }
    doShare();
}

function doShare() {
    app.SendFile(filePath,"We Shall Overcomb!","Check out my harz");
}

// This function returns an input dialog
// title (optional) dialog title, suppressed if empty
// okCallback (required) function called when Ok touched
// hint (optional) empty string displays no hint
// width (optional) 0 to 1 used when creating TextBox
function inputBox(title, okCallback, hint, width)
{
    var options = "NoCancel"
    title = title || "";
    hint = hint || "Your text";
    //suppress title line if no title - pass " " to override
    if( title==="") options += ",NoTitle";
 
    // create dialog
    var dlg = app.CreateDialog( title,options  );
    var lay = app.CreateLayout( "Linear", "" );
    dlg.AddLayout( lay );
 
    // add controls
    var edt = app.CreateTextEdit( "", width );
    edt.SetHint( hint );
    lay.AddChild( edt );
    var layBtn = app.CreateLayout( "Linear", "Horizontal" );
    lay.AddChild( layBtn );
    var btnCancel = app.CreateButton( "Cancel",-1,-1,"custom" );
    btnCancel.SetOnTouch( function(){dlg.Dismiss();} );
    layBtn.AddChild( btnCancel );
    var btnOk = app.CreateButton( "Ok",-1,-1,"custom" );
    layBtn.AddChild( btnOk );    
    btnOk.SetOnTouch( function(){okCallback.call(edt);dlg.Dismiss()} );
 
    // public functions
    dlg.ShowKeyboard = function(  )
    {edt.Focus();app.ShowKeyboard( edt );}
 
    dlg.SetText = function(txt){edt.SetText(txt);}
 
    dlg.ShowWithKeyboard=function()
    {setTimeout(dlg.ShowKeyboard, 100);dlg.Show();}
 
    return dlg
}

function OnBack() {
    var prev = currentpage;
    clearInterval(renderLoopId);
    openlay.SetVisibility("Hide");
    homelay.SetVisibility("Hide");
    camlay.SetVisibility("Hide");
    aboutlay.SetVisibility("Hide");
    hairlay.SetVisibility("Hide");
    if (currentpage == homelay) {
        var yesno = app.CreateYesNoDialog("Do you want to quit?")
        yesno.SetOnTouch(function(result) { if (result == "Yes") app.Exit(); else homelay.SetVisibility("Show"); })
        yesno.Show();
    } else if (currentpage.PrevPage) {
        currentpage.PrevPage.Animate("SlideFromRight")
        lastpage = currentpage;
        currentpage = currentpage.PrevPage;
    } else if (lastpage === undefined) {
        homelay.Animate("SlideFromRight");
        currentpage = homelay;
    } else {
        lastpage.Animate("SlideFromRight");
        currentpage = lastpage;
    }
}