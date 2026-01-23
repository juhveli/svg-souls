export const vertexShaderWGSL = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) typeID : f32,
  @location(2) params : vec4<f32>,
};

struct Uniforms {
  screenSize : vec2<f32>,
  cameraPos : vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32,
  @location(0) center : vec2<f32>,
  @location(1) size : vec2<f32>,
  @location(2) typeID : f32,
  @location(3) params : vec4<f32>
) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>(-0.5,  0.5),
    vec2<f32>( 0.5, -0.5),
    vec2<f32>( 0.5,  0.5)
  );

  var output : VertexOutput;
  output.uv = pos[VertexIndex] + 0.5; // 0.0 to 1.0

  let worldPos = center + (pos[VertexIndex] * size);

  // Camera Transform
  // screenSize in uniforms is the Logical Screen Size (Canvas Size)
  // This preserves the FoV regardless of the actual render target resolution (Low Res)

  let ndcX = (worldPos.x - uniforms.cameraPos.x) / (uniforms.screenSize.x * 0.5);
  let ndcY = (worldPos.y - uniforms.cameraPos.y) / (uniforms.screenSize.y * 0.5);

  // Flip Y because Screen Y+ is Down, Clip Y+ is Up.
  output.position = vec4<f32>(ndcX, -ndcY, 0.0, 1.0);
  output.typeID = typeID;
  output.params = params;

  return output;
}
`;

export const fragmentShaderGBufferWGSL = `
struct FragmentOutput {
  @location(0) albedo : vec4<f32>,
  @location(1) normal : vec4<f32>,
  @location(2) depth : f32,
};

struct GlobalUniforms {
  time : f32,
};
@group(0) @binding(1) var<uniform> global : GlobalUniforms;

fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
    return length(p) - r;
}

fn sdBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
    let d = abs(p) - b;
    return length(max(d, vec2<f32>(0.0))) + min(max(d.x, d.y), 0.0);
}

fn rotate(p: vec2<f32>, angle: f32) -> vec2<f32> {
    let c = cos(angle);
    let s = sin(angle);
    return vec2<f32>(p.x * c - p.y * s, p.x * s + p.y * c);
}

fn sdTuningFork(p: vec2<f32>) -> f32 {
    // Handle
    let handle = sdBox(p - vec2<f32>(0.0, 0.1), vec2<f32>(0.015, 0.15));
    // Base of Fork (Y slightly up)
    let base = sdBox(p - vec2<f32>(0.0, -0.05), vec2<f32>(0.05, 0.015));
    // Prongs
    let prongL = sdBox(p - vec2<f32>(-0.04, -0.15), vec2<f32>(0.015, 0.1));
    let prongR = sdBox(p - vec2<f32>( 0.04, -0.15), vec2<f32>(0.015, 0.1));

    return min(min(min(handle, base), prongL), prongR);
}

@fragment
fn main(
  @location(0) uv : vec2<f32>,
  @location(1) typeID : f32,
  @location(2) params : vec4<f32>
) -> FragmentOutput {
  var dist : f32 = 1.0;
  var color : vec3<f32> = vec3<f32>(0.0);
  var normalVec : vec3<f32> = vec3<f32>(0.0, 0.0, 1.0);

  // --- 1. SDF LOGIC ---
  if (abs(typeID - 1.0) < 0.1) {
    // ECHO WALKER (Player)
    let t = global.time;

    // Params
    let weaponAngle = params.x;
    let moveAngle = params.y;
    let speed = params.z;
    let isAttacking = params.w;

    // --- TENTACLES (Legs) ---
    // Center of mass for tentacles
    let tentacleCenter = vec2<f32>(0.5, 0.7);
    var pTentacle = uv - tentacleCenter;

    // Trailing Logic
    if (speed > 0.5) {
        // Rotate local coordinates to align with movement
        // We want the mass to trail "behind", so if moving right (0), trailing is left (-x)
        pTentacle = rotate(pTentacle, -moveAngle);
        // Stretch backward (positive X in rotated space because we rotated -moveAngle? No.)
        // If moving Right (Angle 0), we want stuff at Left (X < 0) to trail.
        // If we rotate by -MoveAngle, then the X axis aligns with the movement direction.
        // X+ is forward, X- is backward.
        // We want to skew/bend the X- part.
        pTentacle.x += sin(pTentacle.y * 10.0 + t * 15.0) * 0.05; // Fast wiggle
    } else {
        // Idle
        pTentacle.x += sin(pTentacle.y * 10.0 + t * 3.0) * 0.02;
    }

    let tentacleBlob = sdCircle(pTentacle, 0.15);
    // Add noise for "writhing mass" look
    let noise = sin(uv.x * 20.0 + t) * sin(uv.y * 20.0 + t) * 0.01;

    // --- CLOAK (Body) ---
    let pBody = uv - vec2<f32>(0.5, 0.5);
    // Tattered bottom
    let tatter = sin(uv.x * 40.0 + t * 2.0) * 0.03;
    let cloakBox = sdBox(pBody, vec2<f32>(0.12, 0.2));
    let cloakCut = pBody.y - (0.2 + tatter);
    let cloak = max(cloakBox, cloakCut);

    // --- HEAD ---
    let pHead = uv - vec2<f32>(0.5, 0.3);
    let head = sdCircle(pHead, 0.1);

    // Eyes (Glowing)
    // Offset slightly based on aim (weaponAngle) to "look"
    let lookOffset = vec2<f32>(cos(weaponAngle), sin(weaponAngle)) * 0.02;
    let eyeL = sdCircle(pHead - vec2<f32>(-0.04, 0.02) - lookOffset, 0.02);
    let eyeR = sdCircle(pHead - vec2<f32>( 0.04, 0.02) - lookOffset, 0.02);

    // --- WEAPON (Tuning Fork Spear) ---
    let orbitR = 0.35;
    let hover = sin(t * 3.0) * 0.03;
    // Calculate weapon position in UV space (0..1)
    let wx = 0.5 + cos(weaponAngle) * (orbitR + hover);
    let wy = 0.5 + sin(weaponAngle) * (orbitR + hover);
    var pWeapon = uv - vec2<f32>(wx, wy);

    // Rotate weapon to point outwards
    pWeapon = rotate(pWeapon, -weaponAngle - 1.5708); // -90 deg
    let weapon = sdTuningFork(pWeapon);

    // Combine
    let lowerBody = tentacleBlob + noise;
    dist = min(head, cloak);
    dist = min(dist, lowerBody);
    dist = min(dist, weapon);

    // Color
    color = vec3<f32>(0.25, 0.25, 0.3); // Lighter Void to survive lighting/quantization

    if (weapon < 0.001) {
        color = vec3<f32>(0.8, 0.9, 1.0); // Bright Cyan Metal
        if (isAttacking > 0.5) {
             color = vec3<f32>(1.0, 1.0, 1.0); // White Flash
        }
    } else if (min(eyeL, eyeR) < 0.001) {
        color = vec3<f32>(0.0, 1.0, 1.0); // Cyan Eyes
    } else if (lowerBody < 0.001 && dist == lowerBody) {
        color = vec3<f32>(0.15, 0.25, 0.2); // Visible Dark Green
    }

  } else if (abs(typeID - 2.0) < 0.1) {
    // SERUM BOT
    let box = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.3, 0.3));
    let hole = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.15);
    dist = max(box, -hole);
    color = vec3<f32>(0.8, 0.4, 0.1); // Rust

  } else if (abs(typeID - 3.0) < 0.1) {
    // SCAVENGER CRAB
    let body = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.25, 0.2));
    let legL1 = sdBox(uv - vec2<f32>(0.2, 0.4 + sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL2 = sdBox(uv - vec2<f32>(0.2, 0.5 + cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legL3 = sdBox(uv - vec2<f32>(0.2, 0.6 + sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR1 = sdBox(uv - vec2<f32>(0.8, 0.4 - sin(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR2 = sdBox(uv - vec2<f32>(0.8, 0.5 - cos(global.time * 5.0) * 0.02), vec2<f32>(0.15, 0.02));
    let legR3 = sdBox(uv - vec2<f32>(0.8, 0.6 - sin(global.time * 4.0) * 0.02), vec2<f32>(0.15, 0.02));
    let clawL = sdCircle(uv - vec2<f32>(0.15, 0.3), 0.08);
    let clawR = sdCircle(uv - vec2<f32>(0.85, 0.3), 0.08);

    let legs = min(min(legL1, legL2), legL3);
    legs = min(legs, min(min(legR1, legR2), legR3));
    dist = min(body, legs);
    dist = min(dist, clawL);
    dist = min(dist, clawR);
    color = vec3<f32>(0.7, 0.35, 0.1);

  } else if (abs(typeID - 4.0) < 0.1) {
    // GOLGOTHA (The Accumulation)
    // A large, wobbling mass.

    // Main Body (Throbbing Blob)
    let wobble = sin(global.time * 2.0 + uv.y * 10.0) * 0.05;
    let body = sdCircle(uv - vec2<f32>(0.5 + wobble * 0.5, 0.5), 0.3 + wobble);

    // Scrap Pieces (Sticking out)
    let scrap1 = sdBox(uv - vec2<f32>(0.3, 0.7), vec2<f32>(0.1, 0.05)); // Plate
    let scrap2 = sdBox(uv - vec2<f32>(0.7, 0.3), vec2<f32>(0.05, 0.15)); // Pipe
    let scrap3 = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.1); // Core

    // Combine (Union)
    dist = min(body, scrap1);
    dist = min(dist, scrap2);

    // Subtractive "Mouth" or Void
    let mouth = sdCircle(uv - vec2<f32>(0.5, 0.4), 0.1 + sin(global.time * 5.0) * 0.02);
    dist = max(dist, -mouth);

    // Color: Molten Orange/Brown/Rust
    // Pulse color based on time
    let pulse = sin(global.time * 3.0) * 0.2 + 0.8;
    color = vec3<f32>(0.6 * pulse, 0.3, 0.1);

  } else if (abs(typeID - 5.0) < 0.1) {
    // PORCELAIN DANCER

    // Visibility Check (p1 passed from Renderer)
    // p1 = 1.0 (Visible), 0.0 (Invisible)
    if (params.x < 0.5) {
        discard;
    }

    // Body (Ellipse-like Box)
    let torso = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.05, 0.15));

    // Head
    let head = sdCircle(uv - vec2<f32>(0.5, 0.25), 0.06);

    // Arms (Pose)
    let armL = sdBox(uv - vec2<f32>(0.35, 0.4), vec2<f32>(0.1, 0.02));
    let armR = sdBox(uv - vec2<f32>(0.65, 0.4), vec2<f32>(0.1, 0.02));

    // Legs (Dress/Cone approximation or legs)
    let dress = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.1, 0.15));

    // Joints (Glowing) - handled by color

    dist = min(torso, head);
    dist = min(dist, armL);
    dist = min(dist, armR);
    dist = min(dist, dress);

    // Color: Porcelain White with Cyan Glow
    color = vec3<f32>(0.9, 0.95, 1.0);

  } else if (abs(typeID - 6.0) < 0.1) {
    // RUST MITE (High Fidelity)
    // Small, jittery, multi-legged.

    // 1. Body: Segmented, slightly wobbling
    let wobble = sin(global.time * 20.0) * 0.02;
    let bodyMain = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.15);
    let bodyBack = sdCircle(uv - vec2<f32>(0.5 + wobble, 0.4), 0.12);
    let bodyHead = sdCircle(uv - vec2<f32>(0.5 - wobble, 0.6), 0.1);

    // 2. Legs: Fast movement
    let legWiggle = sin(global.time * 30.0 + uv.x * 20.0) * 0.05;
    let legsL = sdBox(uv - vec2<f32>(0.3 + legWiggle, 0.5), vec2<f32>(0.1, 0.15));
    let legsR = sdBox(uv - vec2<f32>(0.7 + legWiggle, 0.5), vec2<f32>(0.1, 0.15));

    dist = min(bodyMain, bodyBack);
    dist = min(dist, bodyHead);
    dist = min(dist, legsL);
    dist = min(dist, legsR);

    // Color: Rust + Blood Dry
    color = vec3<f32>(0.31, 0.20, 0.16); // Rust

  } else if (abs(typeID - 7.0) < 0.1) {
    // RUST DRAGON (W1 Secret)
    let t = global.time * 2.0;

    // Head
    let head = sdCircle(uv - vec2<f32>(0.5 + sin(t)*0.1, 0.2), 0.12);
    let jaw = sdBox(uv - vec2<f32>(0.5 + sin(t)*0.1, 0.28), vec2<f32>(0.08, 0.08));

    // Body Segments
    let body1 = sdCircle(uv - vec2<f32>(0.5 + sin(t - 0.5)*0.1, 0.4), 0.1);
    let body2 = sdCircle(uv - vec2<f32>(0.5 + sin(t - 1.0)*0.1, 0.6), 0.09);
    let body3 = sdCircle(uv - vec2<f32>(0.5 + sin(t - 1.5)*0.1, 0.8), 0.08);

    dist = min(head, jaw);
    dist = min(dist, body1);
    dist = min(dist, body2);
    dist = min(dist, body3);

    color = vec3<f32>(0.4, 0.2, 0.15); // Dark Iron

  } else if (abs(typeID - 8.0) < 0.1) {
    // VANITY WRAITH (W2 Enemy)
    let t = global.time;
    let body = sdBox(uv - vec2<f32>(0.5, 0.4), vec2<f32>(0.15, 0.25));
    let crack1 = sdBox(uv - vec2<f32>(0.5, 0.4), vec2<f32>(0.2, 0.01));
    let crack2 = sdBox(uv - vec2<f32>(0.5, 0.4), vec2<f32>(0.01, 0.3));
    let shard = sdBox(uv - vec2<f32>(0.5 + sin(t)*0.2, 0.2), vec2<f32>(0.05, 0.05));

    dist = min(body, shard);
    dist = max(dist, -crack1);
    dist = max(dist, -crack2);
    color = vec3<f32>(0.7, 0.7, 0.8); // Mirror Grey

  } else if (abs(typeID - 9.0) < 0.1) {
    // RAZOR VINE (W2 Hazard)
    let stem = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.02, 0.4));
    let thorn1 = sdBox(uv - vec2<f32>(0.55, 0.3), vec2<f32>(0.05, 0.01));
    let thorn2 = sdBox(uv - vec2<f32>(0.45, 0.5), vec2<f32>(0.05, 0.01));
    let thorn3 = sdBox(uv - vec2<f32>(0.55, 0.7), vec2<f32>(0.05, 0.01));

    dist = min(stem, thorn1);
    dist = min(dist, thorn2);
    dist = min(dist, thorn3);
    color = vec3<f32>(0.0, 0.5, 0.2); // Green

  } else if (abs(typeID - 10.0) < 0.1) {
    // VITRIA (W2 Boss)
    let t = global.time;

    // Central Diamond (Overlapping Boxes)
    let center = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.1, 0.2));
    let cross = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.2, 0.1));

    // Floating Shards
    let shard1 = sdBox(uv - vec2<f32>(0.5 + sin(t)*0.3, 0.2), vec2<f32>(0.05, 0.1));
    let shard2 = sdBox(uv - vec2<f32>(0.5 + cos(t)*0.3, 0.8), vec2<f32>(0.05, 0.1));
    let shard3 = sdBox(uv - vec2<f32>(0.2, 0.5 + sin(t)*0.3), vec2<f32>(0.1, 0.05));
    let shard4 = sdBox(uv - vec2<f32>(0.8, 0.5 + cos(t)*0.3), vec2<f32>(0.1, 0.05));

    dist = min(center, cross);
    dist = min(dist, shard1);
    dist = min(dist, shard2);
    dist = min(dist, shard3);
    dist = min(dist, shard4);

    color = vec3<f32>(0.8, 0.9, 1.0); // Pale Glass

  } else if (abs(typeID - 11.0) < 0.1) {
    // NARCISSUS (W2 Secret)
    // Frame
    let frameOut = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.25, 0.35));
    let frameIn = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.20, 0.30));
    let frame = max(frameOut, -frameIn);

    // Crack (subtractive)
    let crack = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.3, 0.02));

    // Face silhouette
    let face = sdCircle(uv - vec2<f32>(0.5, 0.45), 0.12);

    let inner = max(face, -crack);
    dist = min(frame, inner);

    color = vec3<f32>(0.6, 0.6, 0.7); // Silver Mirror

  } else if (abs(typeID - 12.0) < 0.1) {
    // GEAR KEEPER (W3 Enemy)
    let t = global.time * 2.0;
    let r = length(uv - vec2<f32>(0.5, 0.5));
    let a = atan2(uv.y - 0.5, uv.x - 0.5);
    let teeth = sin(a * 8.0 + t) * 0.05;
    let gear = abs(r - 0.2 - teeth) - 0.05;
    let hole = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.05);

    dist = max(gear, -hole);
    color = vec3<f32>(0.6, 0.4, 0.2); // Bronze

  } else if (abs(typeID - 13.0) < 0.1) {
    // METRONOME GENERAL (W3 Boss)
    let t = global.time * 4.0;
    let angle = sin(t) * 0.5;
    let p = uv - vec2<f32>(0.5, 0.7);
    let rotX = p.x * cos(angle) - p.y * sin(angle);
    let rotY = p.x * sin(angle) + p.y * cos(angle);

    let base = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.2, 0.1));
    let rod = sdBox(vec2<f32>(rotX, rotY) - vec2<f32>(0.0, -0.25), vec2<f32>(0.02, 0.25));
    let weight = sdBox(vec2<f32>(rotX, rotY) - vec2<f32>(0.0, -0.4), vec2<f32>(0.05, 0.04));

    dist = min(base, rod);
    dist = min(dist, weight);
    color = vec3<f32>(0.7, 0.5, 0.2); // Brass

  } else if (abs(typeID - 14.0) < 0.1) {
    // CHRONO WRAITH (W3 Secret)
    let t = global.time;
    let body = sdCircle(uv - vec2<f32>(0.5, 0.4), 0.15);
    let echo1 = sdCircle(uv - vec2<f32>(0.5 + sin(t*10.0)*0.05, 0.4), 0.12);
    let echo2 = sdCircle(uv - vec2<f32>(0.5 - sin(t*10.0)*0.05, 0.4), 0.12);
    let shred = sdBox(uv - vec2<f32>(0.5, 0.6), vec2<f32>(0.1, 0.2));

    dist = min(body, echo1);
    dist = min(dist, echo2);
    dist = max(dist, -shred);
    color = vec3<f32>(0.2, 0.8, 0.8); // Cyan Time

  } else if (abs(typeID - 15.0) < 0.1) {
    // SILENCE GUARD (W4 Enemy)
    let body = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.15, 0.25));
    let head = sdCircle(uv - vec2<f32>(0.5, 0.3), 0.1);
    let gag = sdBox(uv - vec2<f32>(0.5, 0.32), vec2<f32>(0.12, 0.02));

    dist = min(body, head);
    dist = min(dist, gag);
    color = vec3<f32>(0.1, 0.1, 0.1); // Almost Black

  } else if (abs(typeID - 16.0) < 0.1) {
    // CANTOR (W4 Boss)
    let t = global.time * 3.0;
    let core = sdCircle(uv - vec2<f32>(0.5, 0.4), 0.1);

    let r1 = length(uv - vec2<f32>(0.5, 0.4)) - (0.2 + sin(t)*0.02);
    let ring1 = abs(r1) - 0.02;

    let r2 = length(uv - vec2<f32>(0.5, 0.4)) - (0.3 + sin(t + 1.0)*0.02);
    let ring2 = abs(r2) - 0.02;

    let robe = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.15, 0.2));

    dist = min(core, robe);
    dist = min(dist, ring1);
    dist = min(dist, ring2);
    color = vec3<f32>(0.1, 0.1, 0.15); // Dark Void

  } else if (abs(typeID - 17.0) < 0.1) {
    // BANSHEE (W4 Secret)
    let t = global.time * 2.0;
    let head = sdCircle(uv - vec2<f32>(0.5, 0.3), 0.1);
    let mouth = sdCircle(uv - vec2<f32>(0.5, 0.35), 0.04 + sin(t*10.0)*0.01);
    let veilL = sdBox(uv - vec2<f32>(0.35, 0.5), vec2<f32>(0.05, 0.3));
    let veilR = sdBox(uv - vec2<f32>(0.65, 0.5), vec2<f32>(0.05, 0.3));

    dist = max(head, -mouth);
    dist = min(dist, veilL);
    dist = min(dist, veilR);
    color = vec3<f32>(0.9, 0.8, 0.9); // Pale Pink/White

  } else if (abs(typeID - 18.0) < 0.1) {
    // PRIME CONDUCTOR (W5 Boss)
    let t = global.time;

    let head = sdCircle(uv - vec2<f32>(0.5, 0.3), 0.1);
    let halo = abs(length(uv - vec2<f32>(0.5, 0.3)) - 0.15) - 0.02;

    let robeTop = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.1, 0.1));
    let robeBot = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.15, 0.15));

    let batonP = uv - vec2<f32>(0.7, 0.4 + sin(t*5.0)*0.1);
    let baton = sdBox(batonP, vec2<f32>(0.01, 0.15));

    dist = min(head, halo);
    dist = min(dist, robeTop);
    dist = min(dist, robeBot);
    dist = min(dist, baton);
    color = vec3<f32>(1.0, 0.8, 0.2); // Gold

  } else if (abs(typeID - 19.0) < 0.1) {
    // PARADOX (W5 Secret)
    let t = global.time;

    // Distorted UVs
    let uvShift = vec2<f32>(uv.x + sin(uv.y * 10.0 + t)*0.05, uv.y);

    let cube = sdBox(uvShift - vec2<f32>(0.5, 0.5), vec2<f32>(0.2, 0.2));
    let sphere = sdCircle(uv - vec2<f32>(0.5 + cos(t)*0.2, 0.5 + sin(t)*0.2), 0.15);

    dist = max(cube, -sphere);

    let smallCube = sdBox(uv - vec2<f32>(0.5 + sin(t*2.0)*0.3, 0.5 + cos(t*3.0)*0.3), vec2<f32>(0.05, 0.05));
    dist = min(dist, smallCube);

    color = vec3<f32>(0.5, 0.0, 0.5); // Magic Dark
    if (sin(t * 10.0) > 0.0) {
        color = vec3<f32>(0.0, 1.0, 1.0); // Cyan flash
    }

  } else if (abs(typeID - 20.0) < 0.1) {
    // VIAL OF LIQUID SECONDS (WorldItem)
    let t = global.time;

    // Body: Glass Bottle
    // Use slightly rounded box for the bottle body
    let bottle = sdBox(uv - vec2<f32>(0.5, 0.55), vec2<f32>(0.15, 0.20));

    // Neck: Narrower top
    let neck = sdBox(uv - vec2<f32>(0.5, 0.30), vec2<f32>(0.06, 0.05));

    // Rim: Top of neck
    let rim = sdBox(uv - vec2<f32>(0.5, 0.25), vec2<f32>(0.08, 0.02));

    // Cork: Stopper
    let cork = sdBox(uv - vec2<f32>(0.5, 0.20), vec2<f32>(0.05, 0.03));

    // Combine Glass parts
    let glassShape = min(bottle, neck);
    glassShape = min(glassShape, rim);

    // Liquid: Inside the bottle
    // Liquid level fluctuates slightly
    let liquidLevel = 0.50 + sin(t * 2.0) * 0.02;
    // Basic liquid box
    let liquidBox = sdBox(uv - vec2<f32>(0.5, 0.60), vec2<f32>(0.12, 0.15));
    // Cut off top
    let liquidMask = uv.y - liquidLevel;
    let liquid = max(liquidBox, liquidMask);

    // Twitching bits (Void particles) inside
    let p1 = vec2<f32>(0.5 + sin(t * 5.0)*0.05, 0.6 + cos(t * 3.0)*0.05);
    let bit1 = sdCircle(uv - p1, 0.02);
    let p2 = vec2<f32>(0.5 - cos(t * 4.0)*0.05, 0.55 + sin(t * 6.0)*0.05);
    let bit2 = sdCircle(uv - p2, 0.015);
    let bits = min(bit1, bit2);

    // Shape Composition
    dist = min(glassShape, cork);

    // Coloring Logic
    // Default to Glass Color (Cold Stone)
    color = vec3<f32>(0.3922, 0.3922, 0.4314);

    // Check if we hit the Cork (Rusted Iron)
    if (cork < 0.001) {
        color = vec3<f32>(0.2353, 0.1569, 0.1176);
    }
    // Check if we hit the Liquid (Old Wood / Goldish)
    else if (liquid < 0.001 && glassShape < 0.001) {
         color = vec3<f32>(0.4706, 0.3529, 0.2745);
         // Make it glow slightly using Clay
         if (sin(t * 10.0) > 0.5) {
             color = vec3<f32>(0.3922, 0.2745, 0.1961); // Clay
         }
    }
    // Check bits (Void)
    if (bits < 0.001 && liquid < 0.001) {
        color = vec3<f32>(0.0196, 0.0196, 0.0196);
    }

  } else if (abs(typeID - 21.0) < 0.1) {
    // STEAM VENT (W3 Hazard)
    let t = global.time;
    let rim = abs(sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.4, 0.4))) - 0.05;
    let grill1 = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.35, 0.02));
    let grill2 = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.02, 0.35));

    dist = min(rim, grill1);
    dist = min(dist, grill2);

    let isActive = params.x > 0.5;
    if (isActive) {
        let steam = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.3 + sin(t * 20.0) * 0.02);
        dist = min(dist, steam);
    }

    color = vec3<f32>(0.2, 0.2, 0.2); // Dark Metal
    if (isActive && length(uv - vec2<f32>(0.5, 0.5)) < 0.4) {
        color = vec3<f32>(0.9, 0.9, 1.0); // Steam
    }

  } else if (abs(typeID - 22.0) < 0.1) {
    // STEAM MARSHAL (W3 Sub-Boss)
    let t = global.time;
    // Body
    let body = sdBox(uv - vec2<f32>(0.5, 0.4), vec2<f32>(0.2, 0.25));
    // Head
    let head = sdCircle(uv - vec2<f32>(0.5, 0.75), 0.12);
    // Shoulders
    let shoulders = sdBox(uv - vec2<f32>(0.5, 0.6), vec2<f32>(0.35, 0.1));

    dist = min(body, head);
    dist = min(dist, shoulders);

    // Blast Ring (p1)
    let blastR = params.x * 1.5; // Scale radius
    if (blastR > 0.01) {
        let ring = abs(length(uv - vec2<f32>(0.5, 0.4)) - blastR) - 0.05;
        dist = min(dist, ring);
    }

    color = vec3<f32>(0.7, 0.5, 0.2); // Brass
    if (blastR > 0.01 && abs(length(uv - vec2<f32>(0.5, 0.4)) - blastR) < 0.1) {
        color = vec3<f32>(1.0, 1.0, 1.0); // Steam White
    }

  } else if (abs(typeID - 23.0) < 0.1) {
    // LIBRARIAN (W4 Sub-Boss)
    let t = global.time;
    // p1: hoverParam, p2: attackParam
    let hover = sin(params.x) * 0.05;

    // Robes
    let robe = sdBox(uv - vec2<f32>(0.5, 0.4 + hover), vec2<f32>(0.15, 0.3));
    let head = sdCircle(uv - vec2<f32>(0.5, 0.8 + hover), 0.1);

    // Floating Books
    let attack = params.y;
    let bookAngle = t + attack * 10.0;
    let bookDist = 0.3 + attack * 0.5;

    let bookX = 0.5 + cos(bookAngle) * bookDist;
    let bookY = 0.6 + hover + sin(bookAngle) * 0.1;
    let book = sdBox(uv - vec2<f32>(bookX, bookY), vec2<f32>(0.05, 0.07));

    dist = min(robe, head);
    dist = min(dist, book);

    color = vec3<f32>(0.3, 0.1, 0.3); // Dark Purple
    if (dist == book) {
        color = vec3<f32>(0.8, 0.7, 0.5); // Paper/Leather
    }

  } else if (abs(typeID - 24.0) < 0.1) {
    // TRASH COMPACTOR (W1 Sub-Boss)
    let t = global.time;
    let compress = params.x; // 0..1

    // Main Housing
    let housing = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.3, 0.35));

    // Piston/Crusher
    // Moves down based on compress param
    let pistonY = 0.7 - (compress * 0.4);
    let piston = sdBox(uv - vec2<f32>(0.5, pistonY), vec2<f32>(0.25, 0.1));

    // Internal Void (where trash goes)
    let voidBox = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.2, 0.2));

    dist = max(housing, -voidBox);
    dist = min(dist, piston);

    // Hydraulics
    let hyd1 = sdBox(uv - vec2<f32>(0.3, 0.5), vec2<f32>(0.05, 0.3));
    let hyd2 = sdBox(uv - vec2<f32>(0.7, 0.5), vec2<f32>(0.05, 0.3));
    dist = min(dist, hyd1);
    dist = min(dist, hyd2);

    color = vec3<f32>(0.3, 0.3, 0.35); // Steel
    if (compress > 0.5) {
         color = vec3<f32>(0.5, 0.2, 0.2); // Overheating/Active
    }

  } else if (abs(typeID - 25.0) < 0.1) {
    // GLASS BLOWER DEITY (W2 Sub-Boss)
    let t = global.time;
    let heat = params.x; // 0..1 (Glow intensity)

    // Body: Molten Blob
    let wobble = sin(t * 3.0 + uv.y * 10.0) * 0.05;
    let body = sdCircle(uv - vec2<f32>(0.5 + wobble, 0.4), 0.15 + heat * 0.05);

    // Pipe
    let pipe = sdBox(uv - vec2<f32>(0.5, 0.7), vec2<f32>(0.02, 0.3));

    // Head/Mask
    let mask = sdBox(uv - vec2<f32>(0.5, 0.75), vec2<f32>(0.08, 0.1));

    dist = min(body, pipe);
    dist = min(dist, mask);

    // Color Logic
    color = vec3<f32>(0.6, 0.8, 0.9); // Cold Glass
    if (heat > 0.1) {
        // Transition to Orange/Red
        let mixFactor = heat;
        let hotColor = vec3<f32>(1.0, 0.5, 0.1);
        color = mix(color, hotColor, mixFactor);
    }

  } else if (abs(typeID - 26.0) < 0.1) {
    // THE GATEKEEPER (W5 Sub-Boss)
    let t = global.time;
    let flash = params.x; // 0..1

    // Central Lens
    let lens = sdCircle(uv - vec2<f32>(0.5, 0.5), 0.2);

    // Outer Rim (Mechanical)
    let rim = abs(length(uv - vec2<f32>(0.5, 0.5)) - 0.22) - 0.02;

    // Tendrils/Spikes (Rotating)
    let pRot = rotate(uv - vec2<f32>(0.5, 0.5), t * 0.5);
    let spike1 = sdBox(pRot - vec2<f32>(0.0, 0.3), vec2<f32>(0.02, 0.1));
    let spike2 = sdBox(pRot - vec2<f32>(0.0, -0.3), vec2<f32>(0.02, 0.1));
    let spike3 = sdBox(pRot - vec2<f32>(0.3, 0.0), vec2<f32>(0.1, 0.02));
    let spike4 = sdBox(pRot - vec2<f32>(-0.3, 0.0), vec2<f32>(0.1, 0.02));

    dist = min(lens, rim);
    dist = min(dist, spike1);
    dist = min(dist, spike2);
    dist = min(dist, spike3);
    dist = min(dist, spike4);

    // Color
    color = vec3<f32>(0.2, 0.6, 0.8); // Magic Bright Blue

    // Flash Effect
    if (flash > 0.01) {
       color = mix(color, vec3<f32>(1.0, 1.0, 1.0), flash);
    }

  } else if (abs(typeID - 27.0) < 0.1) {
    // MANNEQUIN (W1 Enemy)
    // Glass humanoid
    let t = global.time;

    // Body
    let torso = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.1, 0.2));
    let head = sdCircle(uv - vec2<f32>(0.5, 0.75), 0.08);

    // Limbs
    let armL = sdBox(uv - vec2<f32>(0.35, 0.5), vec2<f32>(0.03, 0.2));
    let armR = sdBox(uv - vec2<f32>(0.65, 0.5), vec2<f32>(0.03, 0.2));
    let legL = sdBox(uv - vec2<f32>(0.4, 0.2), vec2<f32>(0.04, 0.2));
    let legR = sdBox(uv - vec2<f32>(0.6, 0.2), vec2<f32>(0.04, 0.2));

    dist = min(torso, head);
    dist = min(dist, armL);
    dist = min(dist, armR);
    dist = min(dist, legL);
    dist = min(dist, legR);

    // Crack (random-ish looking)
    let crack = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.2, 0.01));
    dist = max(dist, -crack);

    color = vec3<f32>(0.8, 0.9, 1.0); // Glass

  } else if (abs(typeID - 28.0) < 0.1) {
    // PISTON DRONE (W3 Enemy)
    // Brass Piston
    let extension = params.x; // 0..1

    // Base
    let base = sdBox(uv - vec2<f32>(0.5, 0.8), vec2<f32>(0.15, 0.05));

    // Cylinder
    let cyl = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.1, 0.25));

    // Piston Head (Moves)
    let headY = 0.5 - (extension * 0.3);
    let head = sdBox(uv - vec2<f32>(0.5, headY), vec2<f32>(0.12, 0.05));

    // Rod
    let rod = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.04, 0.3));

    dist = min(base, cyl);
    dist = min(dist, head);
    dist = min(dist, rod);

    color = vec3<f32>(0.7, 0.6, 0.2); // Brass

  } else if (abs(typeID - 29.0) < 0.1) {
    // WIREFRAME APPLE (W5 Glitch Item)
    // "Tastes of ozone and math."
    let t = global.time;
    let wobble = sin(t * 5.0) * 0.02;

    // Base Shape: Circle
    let p = uv - vec2<f32>(0.5, 0.45 + wobble);
    let apple = sdCircle(p, 0.18);
    // Leaf
    let leaf = sdBox(uv - vec2<f32>(0.55, 0.65 + wobble), vec2<f32>(0.04, 0.02));

    dist = min(apple, leaf);

    // Wireframe Grid Logic
    // We only render if we are near a grid line
    let gridSize = 15.0;
    let gridX = abs(fract(uv.x * gridSize + t * 0.5) - 0.5);
    let gridY = abs(fract(uv.y * gridSize - t * 0.5) - 0.5);
    let lineThick = 0.1;

    // Check if inside the shape
    if (dist < 0.001) {
        // If on a grid line, draw bright green
        if (gridX < lineThick || gridY < lineThick) {
            color = vec3<f32>(0.2, 1.0, 0.2); // Bright Matrix Green
        } else {
            // Otherwise, dark transparent green
            color = vec3<f32>(0.0, 0.1, 0.0);
        }
    } else {
        // Outside, just discard as usual (handled by main check)
    }

  } else if (abs(typeID - 30.0) < 0.1) {
    // PIXELATED TEAR (W5 Glitch Item)
    // "Sorrow at low resolution."
    let t = global.time;

    // Pixelate UVs
    let pixels = 16.0;
    let uvi = floor(uv * pixels) / pixels + (0.5 / pixels);

    // Falling animation (stepped)
    let yOffset = floor(sin(t * 2.0) * 4.0) / 4.0 * 0.05;
    let p = uvi - vec2<f32>(0.5, 0.5 + yOffset);

    // Blocky Teardrop Shape construction
    let centerBox = sdBox(p, vec2<f32>(0.1, 0.1));
    let bottomBox = sdBox(p - vec2<f32>(0.0, -0.1), vec2<f32>(0.1, 0.05));
    let topBox = sdBox(p - vec2<f32>(0.0, 0.1), vec2<f32>(0.05, 0.05));
    let tipBox = sdBox(p - vec2<f32>(0.0, 0.15), vec2<f32>(0.02, 0.02));

    let shape = min(min(min(centerBox, bottomBox), topBox), tipBox);

    dist = shape;
    color = vec3<f32>(0.2, 0.4, 1.0); // Blue

  } else if (typeID > 30.5) {
     // Safety discard for undefined future IDs
     discard;
  } else {
    // DEFAULT CUBE (Fallback for debugging or glitched entities)
    dist = sdBox(uv - vec2<f32>(0.5, 0.5), vec2<f32>(0.4, 0.4));
    color = vec3<f32>(0.5, 0.5, 0.5);
  }

  // --- 2. RENDER ---
  if (dist > 0.0) {
    discard;
  }

  // Fake Normal Calculation
  normalVec = normalize(vec3<f32>((uv.x - 0.5) * 2.0, (uv.y - 0.5) * 2.0, 0.5));

  var output : FragmentOutput;
  output.albedo = vec4<f32>(color, 1.0);
  output.normal = vec4<f32>(normalVec * 0.5 + 0.5, 1.0);
  output.depth = 0.5;

  return output;
}
`;

export const fragmentShaderLightingWGSL = `
struct Uniforms {
  screenSize : vec2<f32>,
  cameraPos : vec2<f32>,
  lightPos : vec2<f32>,
  lightColor : vec3<f32>,
  ambientColor : vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(1) var albedoTex : texture_2d<f32>;
@group(0) @binding(2) var normalTex : texture_2d<f32>;
@group(0) @binding(3) var depthTex : texture_2d<f32>;
@group(0) @binding(4) var samp : sampler;

@fragment
fn main(@builtin(position) coord : vec4<f32>) -> @location(0) vec4<f32> {
  // Use texture dimensions for UV calc to be resolution independent
  let dims = vec2<f32>(textureDimensions(albedoTex));
  let uv = coord.xy / dims;

  let albedo = textureSample(albedoTex, samp, uv);

  if (albedo.a < 0.1) {
    return vec4<f32>(0.02, 0.02, 0.03, 1.0); // Dark ambient background
  }

  let normalEncoded = textureSample(normalTex, samp, uv);
  let normal = normalize((normalEncoded.xyz - 0.5) * 2.0);

  // Reconstruct World Position
  // We use the Uniform ScreenSize (High Res) for this projection math
  // because the G-Buffer was rendered using that projection.
  // The 'uv' variable here runs 0..1 across the low-res texture,
  // which corresponds to 0..1 across the high-res screen logically.

  let ndc = (uv * 2.0) - 1.0;

  let worldPos = vec2<f32>(
     (ndc.x * uniforms.screenSize.x * 0.5) + uniforms.cameraPos.x,
     (-ndc.y * uniforms.screenSize.y * 0.5) + uniforms.cameraPos.y
  );

  let lightDir = uniforms.lightPos - worldPos;
  let dist = length(lightDir);

  let lightDir3D = normalize(vec3<f32>(lightDir.x, lightDir.y, 50.0));

  let diffuse = max(dot(normal, lightDir3D), 0.0);

  let attenuation = 1.0 / (1.0 + 0.005 * dist + 0.0001 * dist * dist);

  let lighting = uniforms.ambientColor + (uniforms.lightColor * diffuse * attenuation);

  return vec4<f32>(albedo.rgb * lighting, 1.0);
}
`;

export const vertexShaderFullscreenWGSL = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex fn main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>(-1.0,  1.0),
    vec2<f32>(-1.0,  1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0)
  );
  var output : VertexOutput;
  output.position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);

  // Map Clip Space (-1..1) to UV (0..1)
  // Flip Y: Clip Y=1 (Top) -> UV Y=0. Clip Y=-1 (Bottom) -> UV Y=1.
  output.uv = vec2<f32>(pos[VertexIndex].x * 0.5 + 0.5, 0.5 - pos[VertexIndex].y * 0.5);

  return output;
}
`;

export const fragmentShaderPostProcessWGSL = `
@group(0) @binding(0) var lightingTex : texture_2d<f32>;
@group(0) @binding(1) var samp : sampler;

fn getBayer(x: i32, y: i32) -> f32 {
    let m = array<i32, 16>(
        0, 8, 2, 10,
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
    );
    let idx = (y % 4) * 4 + (x % 4);
    return f32(m[idx]) / 16.0 - 0.5;
}

fn getNearestGloomColor(col: vec3<f32>) -> vec3<f32> {
    var palette = array<vec3<f32>, 16>(
        vec3<f32>(0.0196, 0.0196, 0.0196), // Void
        vec3<f32>(0.0588, 0.0784, 0.0588), // Deep Shadow
        vec3<f32>(0.0980, 0.1373, 0.0980), // Swamp Green
        vec3<f32>(0.1569, 0.1961, 0.1569), // Dark Moss
        vec3<f32>(0.2353, 0.1569, 0.1176), // Rusted Iron
        vec3<f32>(0.3137, 0.1961, 0.1569), // Rust
        vec3<f32>(0.3922, 0.2745, 0.1961), // Clay
        vec3<f32>(0.4706, 0.3529, 0.2745), // Old Wood
        vec3<f32>(0.3922, 0.3922, 0.4314), // Cold Stone
        vec3<f32>(0.5098, 0.5098, 0.5098), // Grey
        vec3<f32>(0.6275, 0.6275, 0.5882), // Old Bone
        vec3<f32>(0.7843, 0.7843, 0.7451), // Pale Bone
        vec3<f32>(0.1961, 0.0392, 0.0392), // Blood Dry
        vec3<f32>(0.4706, 0.0784, 0.0784), // Blood Fresh
        vec3<f32>(0.0392, 0.1176, 0.1961), // Magic Dark
        vec3<f32>(0.1961, 0.5882, 0.7843)  // Magic Bright
    );

    var minDist = 100.0; // Large number
    var bestColor = palette[0];

    for (var i = 0; i < 16; i++) {
        let p = palette[i];
        let d = distance(col, p);
        if (d < minDist) {
            minDist = d;
            bestColor = p;
        }
    }
    return bestColor;
}

@fragment
fn main(@builtin(position) coord : vec4<f32>, @location(0) uv : vec2<f32>) -> @location(0) vec4<f32> {
    // Sample texture with nearest sampler (passed in bind group)
    let color = textureSample(lightingTex, samp, uv).rgb;

    // Apply Dither
    let dither = getBayer(i32(coord.x), i32(coord.y));
    let ditheredColor = color + vec3<f32>(dither * 0.15); // Adjust spread as needed

    // Quantize
    let finalColor = getNearestGloomColor(ditheredColor);

    return vec4<f32>(finalColor, 1.0);
}
`;
