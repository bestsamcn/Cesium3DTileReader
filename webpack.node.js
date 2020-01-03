import { join } from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const cwd = process.cwd();

export default function(webpackConfig, {webpack}) {

    //删除progress plugin
    webpackConfig.plugins.splice(webpackConfig.plugins.length - 1, 1);
    webpackConfig.entry = {
        main: './src/main/sevices/reader.ts',
    };
    webpackConfig.output.path = join(cwd, './lib/reader');
    webpackConfig.target = 'node';

    webpackConfig.plugins.push(
        new webpack.DefinePlugin({
            $dirname: '__dirname',
        })
    );
    return webpackConfig;
}
