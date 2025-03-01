// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { FC, memo, useEffect, useState } from 'react';
import { useSimVar, useArinc429Var } from '@flybywiresim/fbw-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { EfisSide, NdSymbol } from '@shared/NavigationDisplay';
import { CrossTrack } from '../elements/CrossTrack';
import { ToWaypointIndicator } from '../elements/ToWaypointIndicator';
import { FlightPlan } from '../elements/FlightPlan';
import { MapParameters } from '../utils/MapParameters';

export interface PlanModeProps {
    side: EfisSide,
    symbols: NdSymbol[],
    adirsAlign: boolean,
    rangeSetting: number,
    ppos: LatLongData,
    mapHidden: boolean,
}

export const PlanMode: FC<PlanModeProps> = ({ side, symbols, adirsAlign, rangeSetting, ppos, mapHidden }) => {
    const [planCentreLat] = useSimVar('L:A32NX_SELECTED_WAYPOINT_LAT', 'Degrees');
    const [planCentreLong] = useSimVar('L:A32NX_SELECTED_WAYPOINT_LONG', 'Degrees');
    const trueHeading = useArinc429Var('L:A32NX_ADIRS_IR_1_TRUE_HEADING');
    const irMaint = useArinc429Var('L:A32NX_ADIRS_IR_1_MAINT_WORD');
    const [trueRefPb] = useSimVar('L:A32NX_PUSH_TRUE_REF', 'bool');
    const [trueRef, setTrueRef] = useState(false);
    const [mapParams] = useState<MapParameters>(new MapParameters());

    useEffect(() => {
        mapParams.compute({ lat: planCentreLat, long: planCentreLong }, 0, rangeSetting / 2, 250, 0);
    }, [planCentreLat, planCentreLong, rangeSetting]);

    useEffect(() => {
        setTrueRef((irMaint.getBitValueOr(15, false) || trueRefPb) && !irMaint.getBitValueOr(2, false));
    }, [irMaint.value, trueRefPb]);

    return (
        <>
            <Overlay rangeSetting={rangeSetting} />

            <g id="map" clipPath="url(#plan-mode-map-clip)" visibility={mapHidden ? 'hidden' : 'visible'}>
                <FlightPlan
                    x={384}
                    y={384}
                    side={side}
                    range={rangeSetting}
                    symbols={symbols}
                    mapParams={mapParams}
                    mapParamsVersion={mapParams.version}
                    debug={false}
                />
            </g>

            {adirsAlign && !mapHidden && mapParams.valid && (
                <Plane location={ppos} heading={trueHeading.value} mapParams={mapParams} />
            )}

            <ToWaypointIndicator side={side} trueRef={trueRef} />

            <CrossTrack x={44} y={690} side={side} isPlanMode />
        </>
    );
};

interface OverlayProps {
    rangeSetting: number,
}

const Overlay: FC<OverlayProps> = memo(({ rangeSetting }) => (
    <>
        <clipPath id="plan-mode-map-clip">
            <polygon points="45,112 140,112 280,56 488,56 628,112 723,112 723,720 114,720 114,633 45,633" />
        </clipPath>
        <g strokeWidth={3}>
            <circle cx={384} cy={384} r={250} className="White" />

            <path d="M259,384a125,125 0 1,0 250,0a125,125 0 1,0 -250,0" strokeDasharray="14 13" className="White" />

            <text x={310} y={474} className="Cyan" fontSize={22}>{rangeSetting / 4}</text>
            <text x={212} y={556} className="Cyan" fontSize={22}>{rangeSetting / 2}</text>

            <text x={384} y={170} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">N</text>
            <path d="M384,141.5 L390,151 L378,151 L384,141.5" fill="white" stroke="none" />

            <text x={598} y={384} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">E</text>
            <path d="M626.2,384 L617,390 L617,378 L626.5,384" fill="white" stroke="none" />

            <text x={384} y={598} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">S</text>
            <path d="M384,626.5 L390,617 L378,617 L384,626.5" fill="white" stroke="none" />

            <text x={170} y={384} className="White" fontSize={25} textAnchor="middle" alignmentBaseline="central">W</text>
            <path d="M141.5,384 L151,390 L151,378 L141.5,384" fill="white" stroke="none" />
        </g>
    </>
));

interface PlaneProps {
    location: Coordinates,
    heading: Degrees, // True
    mapParams: MapParameters,
}

const Plane: FC<PlaneProps> = ({ location, heading, mapParams }) => {
    const [x, y] = mapParams.coordinatesToXYy(location);
    const rotation = mapParams.rotation(heading);

    return (
        <g transform={`translate(${x} ${y}) rotate(${rotation} 384 384)`}>
            <path id="plane-shadow" d="M 384 358 l 0 75 m -37 -49 l 74 0 m -50 36 l 26 0" className="shadow" strokeWidth={5.5} strokeLinejoin="round" strokeLinecap="round" />
            <path id="plane" d="M 384 358 l 0 75 m -37 -49 l 74 0 m -50 36 l 26 0" className="Yellow" strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        </g>
    );
};
