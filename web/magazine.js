////////////////////////////////////////////////////////////////////////
//
// Neil Marshall - Link Information Technology Ltd 2016
//
////////////////////////////////////////////////////////////////////////

var MagazineView = {
  magazineMode: false,
  oldScale: 1,
  currentPage: 1,
  currentScale: 1,
  layout:
    window.location.hash.indexOf("single=true") > -1
      ? "single"
      : $(window).width() < $(window).height()
      ? "single"
      : "double",
  maxScale: 2,
  init: function() {
    $("#toolbarViewerRight").prepend(
      `<button id="magazineMode" class="toolbarButton magazineMode hiddenLargeView" title="Switch to Magazine Mode" tabindex="99" data-l10n-id="magazine_mode">
        <span data-l10n-id="magazine_mode_label">Magazine Mode</span>
      </button>`
    );
    $("#secondaryToolbarButtonContainer").prepend(
      `<button id="secondaryMagazineMode" class="secondaryToolbarButton magazineMode visibleLargeView" title="Switch to Magazine Mode" tabindex="51" data-l10n-id="magazine_mode">
        <span data-l10n-id="magazine_mode_label">Magazine Mode</span>
      </button>`
    );

    $(document).on("click", "#magazineMode,#exitMagazineView", function(e) {
      if (!MagazineView.magazineMode) MagazineView.start();
      else MagazineView.destroy();
    });

    $(document).on("click", "#secondaryMagazineMode", function(e) {
      if (!MagazineView.magazineMode) MagazineView.start();
      else MagazineView.destroy();

      PDFViewerApplication.secondaryToolbar.close();
    });

    $(document).on("click", "#magazineContainer .previous-button", function(e) {
      $("#magazine").turn("previous");
    });

    $(document).on("click", "#magazineContainer .next-button", function(e) {
      $("#magazine").turn("next");
    });

    if (window.location.hash.indexOf("magazineMode=true") > -1) {
      document.addEventListener(
        "pagesloaded",
        MagazineView.launchMagazineMode,
        true
      );
    }
  },
  launchMagazineMode: function(e) {
    document.removeEventListener(
      "pagesloaded",
      MagazineView.launchMagazineMode,
      true
    );
    $("#magazineMode").click();
  },
  configureToolbars: function() {
    if (MagazineView.magazineMode) {
      $(".toolbar").hide();
    } else {
      $(".toolbar").show();
    }
  },
  start: function() {
    if (PDFViewerApplication.sidebarOpen)
      document.getElementById("sidebarToggle").click();

    MagazineView.magazineMode = true;
    MagazineView.oldScale = PDFViewerApplication.pdfViewer.currentScale;
    PDFViewerApplication.pdfViewer.currentScaleValue = "page-fit";
    $("#viewerContainer").after(
      `<div id="magazineContainer">
        <div id="magazine"></div>
      </div>`
    );

    MagazineView.currentPage = PDFViewerApplication.page;

    MagazineView.configureToolbars();

    $("#viewerContainer").hide();

    $("#magazine").show();

    // Change BackgroundColor
    if (window.location.hash.indexOf("backgroundColor=") > -1) {
      const arr = window.location.hash.split("&");
      const findColor = arr.find(data => {
        let arrNewData = data.split("=");
        return arrNewData[0] === "#backgroundColor";
      });
      const newColor = findColor.replace("#", "").split("=");
      document.body.style.backgroundColor = newColor[1];
    }

    //$("#magazine").bind("missing", function (event, pages) {
    //    MagazineView.loadTurnJsPages(pages, this, false, false);
    //});

    //$("#magazine").bind("turning", function (event, page, view) {
    //    if (!$('#magazine').turn('hasPage', page)) {

    //        MagazineView.loadTurnJsPages([page], this, false, true).then(function () {
    //            $('#magazine').turn('page', page);
    //        });

    //        event.preventDefault();
    //    }

    //});

    var pages = [1];

    MagazineView.loadTurnJsPages(pages, $("#magazine"), true, true).then(
      function() {
        $("#magazine").turn({
          autoCenter: true,
          display: "single",
          width: $("#viewer .canvasWrapper canvas")[0].width,
          height: $("#viewer .canvasWrapper canvas")[0].height,
          pages: PDFViewerApplication.pdfDocument.numPages,
          page: 1,
          elevation: 100,
          duration: 600,
          acceleration: !MagazineView.isChrome(),
          when: {
            missing: function(event, pages) {
              MagazineView.loadTurnJsPages(pages, this, false, false);
            },
            turning: function(event, page, view) {
              if (!$("#magazine").turn("hasPage", page)) {
                MagazineView.loadTurnJsPages([page], this, false, true).then(
                  function() {
                    $("#magazine").turn("page", page);
                  }
                );

                event.preventDefault();
              }

              MagazineView.currentPage = page;
              MagazineView.showHidePageButtons(page);
            }
          }
        });

        MagazineView.showHidePageButtons(MagazineView.currentPage);

        setTimeout(function() {
          $("#magazine").turn("display", MagazineView.layout);

          var multiplier = MagazineView.layout == "double" ? 2 : 1;
          var diff = 0;

          if ($(window).width() > $(window).height()) {
            diff = $(window).height() - $("#magazine canvas")[0].height;
            $("#magazine").addClass("center");
          } else {
            diff = $(window).width() - $("#magazine canvas")[0].width;
            // Make Page Vertical Center
            $("#magazine").css({
              margin: `${($(window).height() -
                ($("#magazine canvas")[0].height + diff)) /
                2}px 0`
            });
          }

          $("#magazine").turn(
            "size",
            ($("#magazine canvas")[0].width + diff) * multiplier,
            $("#magazine canvas")[0].height + diff
          );

          if (MagazineView.currentPage > 1)
            $("#magazine").turn("page", MagazineView.currentPage);

          $("#magazineContainer").zoom({
            max: MagazineView.maxScale,
            flipbook: $("#magazine"),
            when: {
              resize: function(event, scale, page, pageElement) {
                MagazineView.currentScale = scale;
                MagazineView.loadTurnJsPages(
                  $("#magazine").turn("view"),
                  $("#magazine"),
                  false,
                  false
                );
              },
              zoomIn: function() {
                $("#magazine").addClass("zoom-in");
                MagazineView.resizeViewport();
              },
              zoomOut: function() {
                setTimeout(function() {
                  $("#magazine")
                    .addClass("animated")
                    .removeClass("zoom-in");
                  MagazineView.resizeViewport();
                }, 0);
              },
              swipeLeft: function() {
                $("#magazine").turn("next");
              },
              swipeRight: function() {
                $("#magazine").turn("previous");
              }
            }
          });

          $(".zoom-icon").bind("click", function() {
            if ($(this).hasClass("zoom-icon-in"))
              $("#magazineContainer").zoom("zoomIn");
            else if ($(this).hasClass("zoom-icon-out"))
              $("#magazineContainer").zoom("zoomOut");
          });
        }, 10);
      }
    );
  },
  showHidePageButtons: function(page) {
    $("#magazineContainer .previous-button").show();
    $("#magazineContainer .previous-button").show();

    if (page == 1) $("#magazineContainer .previous-button").hide();
    else $("#magazineContainer .previous-button").show();

    if (page == $("#magazine").turn("pages"))
      $("#magazineContainer .next-button").hide();
    else $("#magazineContainer .next-button").show();
  },
  resizeViewport: function() {
    var width = $(window).width(),
      height = $(window).height(),
      options = $("#magazine").turn("options");

    $("#magazine").removeClass("animated");

    $("#magazineContainer")
      .css({
        width: width,
        height: height - $(".toolbar").height()
      })
      .zoom("resize");

    if ($("#magazine").turn("zoom") == 2) {
      var bound = MagazineView.calculateBound({
        width: options.width,
        height: options.height,
        boundWidth: Math.min(options.width, width),
        boundHeight: Math.min(options.height, height)
      });

      if (bound.width % 2 !== 0) bound.width -= 1;

      if (
        bound.width != $("#magazine").width() ||
        bound.height != $("#magazine").height()
      ) {
        $("#magazine").turn("size", bound.width, bound.height);

        if ($("#magazine").turn("page") == 1) $("#magazine").turn("peel", "br");
      }

      $("#magazine").css({ top: -bound.height / 2, left: -bound.width / 2 });
    }

    $("#magazine").addClass("animated");
  },
  calculateBound: function(d) {
    var bound = { width: d.width, height: d.height };

    if (bound.width > d.boundWidth || bound.height > d.boundHeight) {
      var rel = bound.width / bound.height;

      if (
        d.boundWidth / rel > d.boundHeight &&
        d.boundHeight * rel <= d.boundWidth
      ) {
        bound.width = Math.round(d.boundHeight * rel);
        bound.height = d.boundHeight;
      } else {
        bound.width = d.boundWidth;
        bound.height = Math.round(d.boundWidth / rel);
      }
    }

    return bound;
  },
  cloneCanvas: function(oldCanvas) {
    //create a new canvas
    var newCanvas = document.createElement("canvas");
    var context = newCanvas.getContext("2d");

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);

    //return the new canvas
    return newCanvas;
  },
  loadTurnJsPages: function(pages, magazine, isInit, defer, scale) {
    var deferred = null;

    if (defer) deferred = $.Deferred();

    var pagesRendered = 0;
    for (var i = 0; i < pages.length; i++) {
      PDFViewerApplication.pdfDocument.getPage(pages[i]).then(function(page) {
        var destinationCanvas = document.createElement("canvas");

        var unscaledViewport = page.getViewport(1);
        var divider = MagazineView.layout == "double" ? 2 : 1;

        var scale = Math.min(
          ($("#mainContainer").height() - 20) / unscaledViewport.height,
          ($("#mainContainer").width() - 80) / divider / unscaledViewport.width
        );

        var viewport = page.getViewport(scale);

        //var viewport = PDFViewerApplication.pdfViewer.getPageView(page.pageIndex).viewport;

        if (MagazineView.currentScale > 1)
          viewport = page.getViewport(MagazineView.currentScale);

        destinationCanvas.height = viewport.height; // - ((viewport.height / 100) * 10);
        destinationCanvas.width = viewport.width; // - ((viewport.width / 100) * 10);

        var renderContext = {
          canvasContext: destinationCanvas.getContext("2d"),
          viewport: viewport
        };

        page.render(renderContext).promise.then(function() {
          pagesRendered++;

          destinationCanvas.setAttribute("data-page-number", page.pageNumber);
          destinationCanvas.id = "magCanvas" + page.pageNumber;

          if (!isInit) {
            if ($(magazine).turn("hasPage", page.pageNumber)) {
              var oldCanvas = $("#magCanvas" + page.pageNumber)[0];
              oldCanvas.width = destinationCanvas.width;
              oldCanvas.height = destinationCanvas.height;

              //oldCanvas.setAttribute('style', 'float: left; position: absolute; top: 0px; left: 0px; bottom: auto; right: auto;')

              //$(magazine).turn('removePage', page.pageNumber);
              var oldCtx = oldCanvas.getContext("2d");

              oldCtx.drawImage(destinationCanvas, 0, 0);
            } else {
              $(magazine).turn(
                "addPage",
                $(destinationCanvas),
                page.pageNumber
              );
            }
          } else {
            $("#magazine").append($(destinationCanvas));
          }

          if (pagesRendered == pages.length) if (deferred) deferred.resolve();
        });
      });
    }

    if (deferred) return deferred;
  },
  destroy: function() {
    MagazineView.magazineMode = false;
    PDFViewerApplication.pdfViewer.currentScale = MagazineView.oldScale;
    PDFViewerApplication.page = MagazineView.currentPage;

    $("#magazineContainer").hide();
    $("#magazineContainer").empty();
    $("#viewerContainer").show();

    MagazineView.configureToolbars();
  },
  isChrome: function() {
    return navigator.userAgent.indexOf("Chrome") != -1;
  }
};
