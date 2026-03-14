// BinderBot Scanner Mount
// Camera: NexiGo N930AF
// Target height: ~127mm camera lens to card surface
// Card: standard Pokemon (63mm x 88mm)

// ── Tunables ──────────────────────────────────────────────────────────────────
card_w        = 63;    // Pokemon card width (mm)
card_h        = 88;    // Pokemon card height (mm)
card_recess   = 1.5;   // depth of card guide channel in base

base_margin   = 10;    // extra base around card on each side
base_thick    = 4;     // base plate thickness

post_w        = 8;     // square post width
post_height   = 118;   // post height — lens ends up ~127mm above card surface

shelf_thick   = 5;     // top shelf thickness
shelf_margin  = 5;     // shelf overhang past posts

// Camera cradle (NexiGo N930AF body)
// Body is 76.4mm wide, 21.07mm deep, ~29mm tall — add ~2mm clearance each side
cam_w         = 79;    // inner cradle width (76.4 + 2.6mm clearance)
cam_d         = 23;    // inner cradle depth
cam_h         = 30;    // interior height — fully encloses camera body (~29mm tall)
cradle_wall   = 3;     // wall thickness

// Lens view hole through shelf (centered)
lens_hole     = 25;    // square aperture for camera lens to see through shelf

// ── Computed ──────────────────────────────────────────────────────────────────
base_w = card_w + base_margin * 2;
base_d = card_h + base_margin * 2;

shelf_w = base_w + shelf_margin * 2;
shelf_d = base_d + shelf_margin * 2;

// ── Modules ───────────────────────────────────────────────────────────────────
module base_plate() {
    difference() {
        cube([base_w, base_d, base_thick]);
        // Card guide channel — open on front (Y=0) so cards slide in/out easily.
        // Left + right walls and back wall remain as guides; front is open.
        translate([(base_w - card_w) / 2, -0.1, base_thick - card_recess])
            cube([card_w, (base_d - card_h) / 2 + card_h + 0.1, card_recess + 0.1]);
    }
}

module posts() {
    for (x = [0, base_w - post_w])
        for (y = [0, base_d - post_w])
            translate([x, y, base_thick])
                cube([post_w, post_w, post_height]);
}

module cradle() {
    // U-shaped cradle: back wall + two side walls, open at front.
    // Camera slides in from the front (lens-side first, pointing down through shelf hole).
    // Centered on the shelf.
    translate([(shelf_w - cam_w - 2 * cradle_wall) / 2,
               (shelf_d - cam_d - cradle_wall) / 2,
               shelf_thick]) {
        // Back wall
        cube([cam_w + 2 * cradle_wall, cradle_wall, cam_h]);
        // Left wall
        cube([cradle_wall, cam_d + cradle_wall, cam_h]);
        // Right wall
        translate([cam_w + cradle_wall, 0, 0])
            cube([cradle_wall, cam_d + cradle_wall, cam_h]);
        // Top wall — closes the box, camera squeezed in on all sides
        translate([0, 0, cam_h])
            cube([cam_w + 2 * cradle_wall, cam_d + cradle_wall, cradle_wall]);
    }
}

module top_shelf() {
    translate([-shelf_margin, -shelf_margin, base_thick + post_height]) {
        difference() {
            cube([shelf_w, shelf_d, shelf_thick]);
            // Lens view hole — centered through the shelf so lens sees straight down
            translate([(shelf_w - lens_hole) / 2, (shelf_d - lens_hole) / 2, -0.1])
                cube([lens_hole, lens_hole, shelf_thick + 0.2]);
        }
        cradle();
    }
}

// ── Assembly ──────────────────────────────────────────────────────────────────
base_plate();
posts();
top_shelf();
