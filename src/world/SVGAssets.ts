export const SVGAssets = {
    // 1. Procedural Gear (Clockwork)
    gear: (cx: number, cy: number, r: number, teeth: number, hole: boolean = true) => {
        let d = "";
        const outerR = r;
        const innerR = r * 0.8;
        const holeR = r * 0.3;
        const angleStep = (Math.PI * 2) / teeth;

        for (let i = 0; i < teeth; i++) {
            const a0 = i * angleStep;
            const a1 = a0 + angleStep * 0.5; // Tooth width
            const a2 = a0 + angleStep;

            // Tooth Out
            const x0 = cx + Math.cos(a0) * innerR;
            const y0 = cy + Math.sin(a0) * innerR;
            const x1 = cx + Math.cos(a0) * outerR;
            const y1 = cy + Math.sin(a0) * outerR;
            const x2 = cx + Math.cos(a1) * outerR;
            const y2 = cy + Math.sin(a1) * outerR;
            const x3 = cx + Math.cos(a1) * innerR;
            const y3 = cy + Math.sin(a1) * innerR;

            d += (i === 0 ? `M${x0},${y0}` : `L${x0},${y0}`) + ` L${x1},${y1} L${x2},${y2} L${x3},${y3} `;
        }
        d += "Z";

        if (hole) {
            // Cutout hole (Counter-clockwise to create hole in Non-Zero rule)
            d += ` M ${cx + holeR}, ${cy} A ${holeR},${holeR} 0 1,0 ${cx - holeR}, ${cy} A ${holeR},${holeR} 0 1,0 ${cx + holeR}, ${cy}`;
        }

        return d;
    },

    // 2. Junk Pile (Scrapyard Silhouette)
    junkPile: (x: number, y: number, w: number, h: number, seed: number) => {
        // Jagged mountain of trash
        let d = `M${x},${y + h} L${x},${y + h - 10} `; // Start bottom-left
        let cx = x;
        let cy = y + h - 10;

        while (cx < x + w) {
            const stepX = 10 + Math.random() * 20;
            const stepY = (Math.random() - 0.5) * 30; // Up/Down jaggedness

            // Bias towards 'climbing' then 'falling'
            const centerDist = Math.abs((x + w / 2) - cx) / (w / 2); // 1 at edge, 0 at center
            const heightBias = (1 - centerDist) * -h * 0.8; // Peak in middle

            cx += stepX;
            let targetY = y + h + heightBias + stepY;
            targetY = Math.min(targetY, y + h); // Don't go below floor

            d += `L${cx},${targetY} `;
        }

        d += `L${x + w},${y + h} Z`; // Close loop
        return d;
    },

    // 3. Hanging Chain (Industrial)
    chain: (x1: number, y1: number, x2: number, y2: number, sag: number) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2 + sag;
        return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
    }
};
