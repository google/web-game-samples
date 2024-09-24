export class GridSnap
{
    constructor (scene, gridWidth = 3, gridHeight = 3)
    {
        this.scene = scene;

        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;

        this.paddingX = 0;
        this.paddingY = 0;

        this.sprites = new Map();

        scene.scale.on('resize', this.resize, this);
    }

    setPadding (x, y)
    {
        this.paddingX = x;
        this.paddingY = y;

        return this;
    }

    getIndex (position)
    {
        const width = this.gridWidth;
        const height = this.gridHeight;

        switch (position)
        {
            case GridSnap.TOP_LEFT:
                return { x: 0, y: 0, originX: 0, originY: 0, px: 1, py: 1 };
            case GridSnap.TOP_CENTER:
                return { x: Math.floor(width / 2), y: 0, originX: 0.5, originY: 0, px: 0, py: 1 };
            case GridSnap.TOP_RIGHT:
                return { x: width - 1, y: 0, originX: 1, originY: 0, px: -1, py: 1 };
            case GridSnap.CENTER_LEFT:
                return { x: 0, y: Math.floor(height / 2), originX: 0, originY: 0.5, px: 1, py: 0 };
            case GridSnap.CENTER_CENTER:
                return { x: Math.floor(width / 2), y: Math.floor(height / 2), originX: 0.5, originY: 0.5, px: 0, py: 0 };
            case GridSnap.CENTER_RIGHT:
                return { x: width - 1, y: Math.floor(height / 2), originX: 1, originY: 0.5, px: -1, py: 0 };
            case GridSnap.BOTTOM_LEFT:
                return { x: 0, y: height - 1, originX: 0, originY: 1, px: 1, py: -1 };
            case GridSnap.BOTTOM_CENTER:
                return { x: Math.floor(width / 2), y: height - 1, originX: 0.5, originY: 1, px: 0, py: -1 };
            case GridSnap.BOTTOM_RIGHT:
                return { x: width - 1, y: height - 1, originX: 1, originY: 1, px: -1, py: -1 };
            default:
                return { x: 0, y: 0, originX: 0, originY: 0, px: 0, py: 0 };
        }
    }

    addSprite (sprite, position, offsetX = 0, offsetY = 0)
    {
        if (typeof position === 'number')
        {
            const x = position % this.gridWidth;
            const y = Math.floor(position / this.gridWidth);
            const originX = (x === 0) ? 0 : (x === this.gridWidth - 1) ? 1 : 0.5;
            const originY = (y === 0) ? 0 : (y === this.gridHeight - 1) ? 1 : 0.5;

            this.sprites.set(sprite, { x, y, originX, originY, px: 0, py: 0, offsetX, offsetY });
        }
        else
        {
            this.sprites.set(sprite, Phaser.Utils.Objects.Merge(this.getIndex(position), { offsetX, offsetY }));
        }
    }

    removeSprite (sprite)
    {
        this.sprites.delete(sprite);
    }

    resize ()
    {
        const view = this.scene.scale.getViewPort(this.scene.cameras.main);

        const width = view.width;
        const height = view.height;

        const cellWidth = width / this.gridWidth;
        const cellHeight = height / this.gridHeight;

        this.sprites.forEach((position, sprite) =>
        {
            const x = view.x + (position.px * this.paddingX) + (position.originX * cellWidth) + Math.floor(position.x * cellWidth);
            const y = view.y + (position.py * this.paddingY) + (position.originY * cellHeight) + Math.floor(position.y * cellHeight);

            sprite.setPosition(x + position.offsetX, y + position.offsetY);
            sprite.setOrigin(position.originX, position.originY);
        });
    }
}

GridSnap.TOP_LEFT = 'top-left';
GridSnap.TOP_CENTER = 'top-center';
GridSnap.TOP_RIGHT = 'top-right';
GridSnap.CENTER_LEFT = 'center-left';
GridSnap.CENTER_CENTER = 'center';
GridSnap.CENTER_RIGHT = 'center-right';
GridSnap.BOTTOM_LEFT = 'bottom-left';
GridSnap.BOTTOM_CENTER = 'bottom-center';
GridSnap.BOTTOM_RIGHT = 'bottom-right';
GridSnap.CUSTOM = 'custom';
