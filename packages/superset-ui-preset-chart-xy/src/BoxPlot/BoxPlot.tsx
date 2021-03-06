/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable sort-keys, no-magic-numbers, complexity */
import React from 'react';
import { BoxPlotSeries, XYChart } from '@data-ui/xy-chart';
import { chartTheme, ChartTheme } from '@data-ui/theme';
import { Margin, Dimension } from '@superset-ui/dimension';
import { createSelector } from 'reselect';
import createTooltip from './createTooltip';
import XYChartLayout from '../utils/XYChartLayout';
import WithLegend from '../components/WithLegend';
import ChartLegend from '../components/legend/ChartLegend';
import Encoder, { ChannelTypes, Encoding, Outputs } from './Encoder';
import { Dataset, PlainObject } from '../encodeable/types/Data';

chartTheme.gridStyles.stroke = '#f1f3f5';

const DEFAULT_MARGIN = { top: 20, right: 20, left: 20, bottom: 20 };

const defaultProps = {
  className: '',
  margin: DEFAULT_MARGIN,
  theme: chartTheme,
} as const;

type Props = {
  className?: string;
  width: string | number;
  height: string | number;
  margin?: Margin;
  encoding: Encoding;
  data: Dataset;
  theme?: ChartTheme;
} & Readonly<typeof defaultProps>;

export default class BoxPlot extends React.PureComponent<Props> {
  static defaultProps = defaultProps;

  encoder: Encoder;
  private createEncoder: () => void;

  constructor(props: Props) {
    super(props);

    const createEncoder = createSelector(
      (enc: Encoding) => enc,
      (enc: Encoding) => new Encoder({ encoding: enc }),
    );

    this.createEncoder = () => {
      this.encoder = createEncoder(this.props.encoding);
    };

    this.encoder = createEncoder(this.props.encoding);
    this.renderChart = this.renderChart.bind(this);
  }

  renderChart(dim: Dimension) {
    const { width, height } = dim;
    const { data, encoding, margin, theme } = this.props;
    const { channels } = this.encoder;

    const isHorizontal = encoding.y.type === 'nominal';

    const children = [
      <BoxPlotSeries
        key={channels.x.definition.field}
        animated
        data={
          isHorizontal
            ? data.map(row => ({ ...row, y: channels.y.get(row) }))
            : data.map(row => ({ ...row, x: channels.x.get(row) }))
        }
        fill={(datum: PlainObject) => channels.color.encode(datum, '#55acee')}
        fillOpacity={0.4}
        stroke={(datum: PlainObject) => channels.color.encode(datum)}
        strokeWidth={1}
        widthRatio={0.6}
        horizontal={encoding.y.type === 'nominal'}
      />,
    ];

    const layout = new XYChartLayout({
      width,
      height,
      margin: { ...DEFAULT_MARGIN, ...margin },
      theme,
      xEncoder: channels.x,
      yEncoder: channels.y,
      children,
    });

    return layout.renderChartWithFrame((chartDim: Dimension) => (
      <XYChart
        width={chartDim.width}
        height={chartDim.height}
        ariaLabel="BoxPlot"
        margin={layout.margin}
        renderTooltip={createTooltip(this.encoder)}
        showYGrid
        theme={theme}
        xScale={channels.x.definition.scale}
        yScale={channels.y.definition.scale}
      >
        {children}
        {layout.renderXAxis()}
        {layout.renderYAxis()}
      </XYChart>
    ));
  }

  render() {
    const { className, data, width, height } = this.props;

    this.createEncoder();
    const renderLegend = this.encoder.hasLegend()
      ? // eslint-disable-next-line react/jsx-props-no-multi-spaces
        () => <ChartLegend<ChannelTypes, Outputs, Encoding> data={data} encoder={this.encoder} />
      : undefined;

    return (
      <WithLegend
        className={`superset-chart-box-plot ${className}`}
        width={width}
        height={height}
        position="top"
        renderLegend={renderLegend}
        renderChart={this.renderChart}
      />
    );
  }
}
