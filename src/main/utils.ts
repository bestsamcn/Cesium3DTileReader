function inRange(a:any, min:any, max:any) {
	return min <= a && a <= max;
}

function utf8Handler(utfBytes:any) {
	var codePoint = 0;
	var bytesSeen = 0;
	var bytesNeeded = 0;
	var lowerBoundary = 0x80;
	var upperBoundary = 0xBF;

	var codePoints = [];
	var length = utfBytes.length;
	for (var i = 0; i < length; ++i) {
		var currentByte = utfBytes[i];

		// If bytesNeeded = 0, then we are starting a new character
		if (bytesNeeded === 0) {
			// 1 Byte Ascii character
			if (inRange(currentByte, 0x00, 0x7F)) {
				// Return a code point whose value is byte.
				codePoints.push(currentByte);
				continue;
			}

			// 2 Byte character
			if (inRange(currentByte, 0xC2, 0xDF)) {
				bytesNeeded = 1;
				codePoint = currentByte & 0x1F;
				continue;
			}

			// 3 Byte character
			if (inRange(currentByte, 0xE0, 0xEF)) {
				// If byte is 0xE0, set utf-8 lower boundary to 0xA0.
				if (currentByte === 0xE0) {
					lowerBoundary = 0xA0;
				}
				// If byte is 0xED, set utf-8 upper boundary to 0x9F.
				if (currentByte === 0xED) {
					upperBoundary = 0x9F;
				}

				bytesNeeded = 2;
				codePoint = currentByte & 0xF;
				continue;
			}

			// 4 Byte character
			if (inRange(currentByte, 0xF0, 0xF4)) {
				// If byte is 0xF0, set utf-8 lower boundary to 0x90.
				if (currentByte === 0xF0) {
					lowerBoundary = 0x90;
				}
				// If byte is 0xF4, set utf-8 upper boundary to 0x8F.
				if (currentByte === 0xF4) {
					upperBoundary = 0x8F;
				}

				bytesNeeded = 3;
				codePoint = currentByte & 0x7;
				continue;
			}

			throw new Error('String decoding failed.');
		}

		// Out of range, so ignore the first part(s) of the character and continue with this byte on its own
		if (!inRange(currentByte, lowerBoundary, upperBoundary)) {
			codePoint = bytesNeeded = bytesSeen = 0;
			lowerBoundary = 0x80;
			upperBoundary = 0xBF;
			--i;
			continue;
		}

		// Set appropriate boundaries, since we've now checked byte 2 of a potential longer character
		lowerBoundary = 0x80;
		upperBoundary = 0xBF;

		// Add byte to code point
		codePoint = (codePoint << 6) | (currentByte & 0x3F);

		// We have the correct number of bytes, so push and reset for next character
		++bytesSeen;
		if (bytesSeen === bytesNeeded) {
			codePoints.push(codePoint);
			codePoint = bytesNeeded = bytesSeen = 0;
		}
	}

	return codePoints;
}
const decodor = require('iconv-lite');
const fs = require("fs");

import { Matrix4, Cartesian3, Matrix3, TileOrientedBoundingBox } from 'cesium';

/**
 * 创建包围球
 * @param  {array} box       包围盒数据
 * @param  {Matrix4} transform 变换矩阵
 * @return {BoundingSphere}           [description]
 */
export const  createBox = (box:Array<any>, transform:any)=>{
	var scratchMatrix = new Matrix3();
    var scratchHalfAxes = new Matrix3();
    var scratchCenter = new Cartesian3();
    var center = Cartesian3.fromElements(box[0], box[1], box[2], scratchCenter);
    var halfAxes = Matrix3.fromArray(box, 3, scratchHalfAxes);

    // Find the transformed center and halfAxes
    center = Matrix4.multiplyByPoint(transform, center, center);
    var rotationScale = Matrix4.getRotation(transform, scratchMatrix);
    halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

    return new TileOrientedBoundingBox(center, halfAxes).boundingSphere;
}


//数据解析器
export const textDecoder = (view:any)=>{
	var result = '';
	var codePoints = utf8Handler(view);
	var length = codePoints.length;
	for (var i = 0; i < length; ++i) {
		var cp = codePoints[i];
		if (cp <= 0xFFFF) {
			result += String.fromCharCode(cp);
		} else {
			cp -= 0x10000;
			result += String.fromCharCode((cp >> 10) + 0xD800,
				(cp & 0x3FF) + 0xDC00);
		}

	}
	return result;
}

//buffer to  arraybuffer
export const toArrayBuffer = (buffer:Buffer)=>{
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}


//读取外挂json数据
export const readFile = (url:string)=>{
	//读取json buffer
	let jsonBufferString = fs.readFileSync(url);

	//转json字符串
	let jsonString = decodor.decode(jsonBufferString, 'utf8');

	//转json
	let json = JSON.parse(jsonString);
	return json;
}



