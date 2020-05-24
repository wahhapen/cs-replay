import React from 'react'
import PropTypes from 'prop-types'
import * as PIXI from 'pixi.js'
import { ParticleContainer, withPixiApp, Sprite } from '@inlet/react-pixi'

const config = {
    properties: {
        position: true,
        rotation: false,
        scale: false,
        uvs: false,
        alpha: false,
    },

    listeners: [],
    onChange: function (prop, val) {
        this.listeners.forEach((l) => l(prop, val));
    },
}

class Settings extends React.PureComponent {
    state = { ...config.properties, changed: false };

    componentDidMount() {
        config.listeners.push(this.onChange);
    };

    onChange = (prop, val) => {
        this.setState({ [prop]: val, changed: true });
        clearTimeout(this.changeTimeout);
        this.changeTimeout = setTimeout(
            () => this.setState({ changed: false }),
            0
        );
    };

    render() {
        return this.state.changed ? null : this.props.children(this.state);
    };
};

const Sanic = (props) => (
    <Sprite
        {...props}
        image={'./sanic.png'}
        anchor={0.5}
        overwriteProps={false}
        ignoreEvents={true}
    />
);

const Knuckles = (props) => (
    <Sprite
        {...props}
        image={'./knuckles.png'}
        anchor={0.5}
        overwriteProps={false}
        ignoreEvents={true}
    />
);

const Batch = withPixiApp(
    class extends React.PureComponent {
        ticker = 0;
        bounds = null;
        state = { items: [], count: 0, component: null, data: this.props.items };

        static propTypes = {
            count: PropTypes.number.isRequired,
            component: PropTypes.func.isRequired,
            roundTotalTime: PropTypes.number.isRequired,
            roundLastKillTime: PropTypes.number.isRequired,
            onFinish: PropTypes.func.isRequired,
            onWin: PropTypes.func.isRequired,
        };

        static getDerivedStateFromProps(nextProps, prevState) {
            if (
                prevState.count === nextProps.count &&
                prevState.component === nextProps.component
            ) {
                return prevState
            };

            return {
                count: nextProps.count,
                component: nextProps.component,
                items: nextProps.items.map((item) => ({
                    speed: 1,
                    turningSpeed: 1,
                    direction: 1,
                    x: item.positions.x[0],
                    y: item.positions.y[0],
                    _s: 1,
                    scale: 1,
                    rotation: 0,
                    id: item.id,
                    team: item.team,
                })),
            };
        };

        componentDidMount() {
            const padding = 1

            this.bounds = new PIXI.Rectangle(
                -padding,
                -padding,
                this.props.app.screen.width + padding * 2,
                this.props.app.screen.height + padding * 2
            );

            this.props.app.ticker.add(this.tick);
        };

        componentWillUnmount() {
            this.props.app.ticker.remove(this.tick);
        };

        tick = () => {
            if (this.ticker === this.props.roundTotalTime) {
                return this.props.onFinish();
            };
            this.setState(({ items }) => ({
                items: items.map((item) => {
                    const playerIndex = this.state.data.findIndex(
                        (obj) => obj.id === item.id
                    );
                    const playerData = this.state.data[playerIndex]
                    if (this.ticker === this.props.roundLastKillTime + 1) {
                        this.props.onWin(playerData.team)
                    };
                    const posX = playerData.positions.x;
                    const posY = playerData.positions.y;
                    const movementEnded = this.ticker < posX.length;
                    const updX = movementEnded ? posX[this.ticker] : item.x;
                    const updY = movementEnded ? posY[this.ticker] : item.y;
                    const scale = movementEnded ? 0 : 1.55;
                    let newItem = {
                        scale: item._s + scale,
                        x: updX,
                        y: updY,
                        tint: movementEnded ? 0xeeeeee : 1,
                    };

                    if (newItem.x < this.bounds.x) {
                        newItem.x += this.bounds.width
                    } else if (newItem.x > this.bounds.x + this.bounds.width) {
                        newItem.x -= this.bounds.width
                    };

                    if (newItem.y < this.bounds.y) {
                        newItem.y += this.bounds.height
                    } else if (newItem.y > this.bounds.y + this.bounds.height) {
                        newItem.y -= this.bounds.height
                    };

                    return { ...item, ...newItem };
                }),
            }));

            this.ticker++;
        };

        render() {
            const Comp = this.props.component
            return this.state.items.map((props) => (
                <Comp key={props.id} {...props} />
            ));
        };
    }
);

const PlayersScene = ({
    players,
    roundTotalTime,
    roundLastKillTime,
    onFinish,
    onWin,
}) => {
    const csTeam = players.filter((player) => player.team === 3);
    const tTeam = players.filter((player) => player.team === 2);
    return (
        <Settings>
            {(config) => (
                <>
                    <ParticleContainer properties={config}>
                        <Batch
                            roundLastKillTime={roundLastKillTime}
                            roundTotalTime={roundTotalTime}
                            onFinish={onFinish}
                            onWin={onWin}
                            items={csTeam}
                            count={csTeam.length}
                            component={Sanic}
                        />
                    </ParticleContainer>
                    <ParticleContainer properties={config}>
                        <Batch
                            roundLastKillTime={roundLastKillTime}
                            roundTotalTime={roundTotalTime}
                            onFinish={onFinish}
                            onWin={onWin}
                            items={tTeam}
                            count={tTeam.length}
                            component={Knuckles}
                        />
                    </ParticleContainer>
                </>
            )}
        </Settings>
    );
};

export default PlayersScene
