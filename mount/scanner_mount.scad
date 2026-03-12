// BinderBot Scanner Mount
// Camera: NexiGo N930AF
// Target height: 5" (127mm) camera lens to card surface
// Card: standard Pokemon (63mm x 88mm)

// ── Tunables ──────────────────────────────────────────────────────────────────
card_w        = 63;    // Pokemon card width (mm)
card_h        = 88;    // Pokemon card height (mm)
card_recess   = 1.5;   // depth of card guide recess in base

base_margin   = 10;    // extra base around card on each side
base_thick    = 4;     // base plate thickness

post_w        = 8;     // square post width
post_height   = 118;   // post height — lens ends up ~127mm above card surface
                       // (base_thick + post_height + shelf_thick ≈ 127mm)

shelf_thick   = 5;     // top shelf thickness
shelf_margin  = 5;     // shelf overhang past posts

// Camera clip slot (fits N930AF monitor-clip foot)
clip_slot_w   = 30;
clip_slot_d   = 22;
clip_slot_h   = shelf_thick + 2; // through the shelf

// ── Computed ──────────────────────────────────────────────────────────────────
base_w = card_w + base_margin * 2;
base_d = card_h + base_margin * 2;

shelf_w = base_w + shelf_margin * 2;
shelf_d = base_d + shelf_margin * 2;

module base_plate() {
    difference() {
        cube([base_w, base_d, base_thick]);
        // Card guide recess (centered)
        translate([(base_w - card_w) / 2, (base_d - card_h) / 2, base_thick - card_recess])
            cube([card_w, card_h, card_recess + 0.1]);
    }
}

module posts() {
    // Four corner posts
    for (x = [0, base_w - post_w])
        for (y = [0, base_d - post_w])
            translate([x, y, base_thick])
                cube([post_w, post_w, post_height]);
}

module top_shelf() {
    translate([-(shelf_margin), -(shelf_margin), base_thick + post_height])
    difference() {
        cube([shelf_w, shelf_d, shelf_thick]);
        // Camera clip slot (centered)
        translate([(shelf_w - clip_slot_w) / 2, (shelf_d - clip_slot_d) / 2, -0.1])
            cube([clip_slot_w, clip_slot_d, clip_slot_h]);
        // Corner notches so shelf clears posts cleanly
        translate([0, 0, -0.1])                          cube([shelf_margin + post_w, shelf_margin + post_w, shelf_thick + 0.2]);
        translate([shelf_w - shelf_margin - post_w, 0, -0.1])  cube([shelf_margin + post_w, shelf_margin + post_w, shelf_thick + 0.2]);
        translate([0, shelf_d - shelf_margin - post_w, -0.1])  cube([shelf_margin + post_w, shelf_margin + post_w, shelf_thick + 0.2]);
        translate([shelf_w - shelf_margin - post_w, shelf_d - shelf_margin - post_w, -0.1]) cube([shelf_margin + post_w, shelf_margin + post_w, shelf_thick + 0.2]);
    }
}

// ── Assembly ──────────────────────────────────────────────────────────────────
base_plate();
posts();
top_shelf();
