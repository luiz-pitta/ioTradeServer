/**
 * Module that has functions that help the data conversion
 *
 * @author Luiz Guilherme Pitta
 */

exports.shortSignedAtOffset = function(c, offset) {
	let lowerByte = c[offset] & 0xFF;
	let upperByte = c[offset + 1]; // // Interpret MSB as signed
	return (upperByte << 8) + lowerByte;
};

exports.shortUnsignedAtOffset = function(c, offset) {
	let lowerByte = c[offset] & 0xFF;
	let upperByte = c[offset + 1] & 0xFF; // // Interpret MSB as signed
	return (upperByte << 8) + lowerByte;
};

exports.twentyFourBitUnsignedAtOffset = function(c, offset) {
	let lowerByte =  c[offset] & 0xFF;
	let mediumByte = c[offset+1] & 0xFF;
	let upperByte =  c[offset + 2] & 0xFF;
	return (upperByte << 16) + (mediumByte << 8) + lowerByte;
};