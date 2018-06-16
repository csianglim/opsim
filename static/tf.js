// Adapted from http://homes.esat.kuleuven.be/~maapc/Sofia/javascript/demo6/demo6.html
// http://homes.esat.kuleuven.be/~maapc/Sofia/javascript/demo5/demo_transfer_function_bode.html
// TODO: check license

function setup()
{
    var tfNum   = [1];
    var tfDen   = [1, 5, 2];
	var inputBoxNumerator = document.getElementById('num');
	var inputBoxDenominator = document.getElementById('denom');
	var updateTfButton = document.getElementById('update-tf');

	updateTfButton.onclick = submit_transfer_function; 

	var inputBoxValue = function(arr) 	{
		var returnStr = "";
		for (var i = 0; i < arr.length; i++)
		{
			returnStr += arr[i].toString() +  ( i==(arr.length - 1) ? "" : "," );
		}
		return returnStr;
	};
	inputBoxNumerator.value = inputBoxValue(tfNum);
	inputBoxDenominator.value = inputBoxValue(tfDen);
	console.log(inputBoxNumerator.value)
	update_tf(tfNum, tfDen);
}

/** Updates the formula of the Transfer Function under input.
 *	
 *	@param {Array} num -
 *	Array containing the coefficients of the numerator, highest degree first
 *
 *	@param {Array} den -
 *	Array containing the coefficients of the denominator, highest degree first
*/
function update_tf(num, den)
{
	
	var tfLatex		= " $$ H(s) = \\frac{";
	
	/**	Makes a in latex formatted polynomial
	 *
	 *	@param {Array} coeff -
	 *	Array containing the coefficients of the polynomial
	 *
	*/
	var makeLatexPolynom = function(coeff)
		{
			var returnString = "";

			for(var i = 0; i < coeff.length; i++)
			{
				// Add sign expect for highest degree
				if( i != 0 )
					returnString += (coeff[i] < 0) ? '' : '+';
				switch(coeff[i])
				{
					case 0:
						// If the coefficient is zero, remove the sign
						returnString = returnString.slice(0,-1);
						break;
					default:
						returnString += coeff[i];
					case 1:
					case -1:
						// Minus sign in case of -1
						returnString += ( coeff[i] == -1 ) ? '-' : '';
						var degree = coeff.length - i - 1;
						switch(degree)
						{
							case 1:
								returnString += "s";
								break;
							case 0:
								if( Math.abs(coeff[i]) == 1)
									returnString += "1";
								break;
							default:
								returnString += "s^{" + (degree) + "}";
						}
						break;
				}
				
			}
			//console.log("Made polynomial: " + returnString)
			return returnString;
		};
	
	tfLatex += makeLatexPolynom(num) + "}{" + makeLatexPolynom(den) + "} $$";
	
	// update Math
	var math = document.getElementById('tf-function')
	math.innerText = tfLatex;
	MathJax.Hub.Queue(["Typeset",MathJax.Hub,math]);
}

function submit_transfer_function()
{
	var arrayNumerator 		= document.getElementById('num').value.toString().split(/[,;:]+/);
	var arrayDenominator	= document.getElementById('denom').value.toString().split(/[,;:]+/);
	
	// Remove possible empty string element on end
	if(arrayDenominator[arrayDenominator.length - 1] == "")
		arrayDenominator.pop();
	if(arrayNumerator[arrayNumerator.length -1] == "")
		arrayNumerator.pop();
	
	// // Remove possible leading zeros
	while(arrayNumerator[0]=="0")
		arrayNumerator.shift();
	while(arrayDenominator[0]=="0")
		arrayDenominator.shift();
	
	// // check for mistakes
	// if( (arrayNumerator.length == 0) || (arrayDenominator.length==0) )
	// 	{alert("Please fill in a transfer function. One or more boxes is empty.");return;}
	// if( !(areAllNumbers(arrayNumerator) && areAllNumbers(arrayDenominator)) )
	// 	{alert("Please fill in a correct transfer function according to the given syntax");return}
	// if(arrayDenominator.length == 1 && arrayDenominator[0] == "0")
	// 	{alert("Please do not devide by zero");return;}
	// if(arrayDenominator.length < arrayNumerator.length)
	// 	{alert("The order of the denominator should be greater than the order of the numerator.");return;}
	
	// convert array to numbers
	arrayNumerator		= arrayNumerator.map( function(el) { return parseFloat(el);});
	arrayDenominator	= arrayDenominator.map( function(el) { return parseFloat(el);});
	
	// Update everything
	// dynSys		=	control.system.tf(arrayNumerator,arrayDenominator);
	
	// // Check on unstable poles
	// var poles = dynSys.getPoles();
	
	// noUnstablePoles = true;
	// for( var i = 0; (i < poles.length) && noUnstablePoles; i++)
	// {
	// 		if(math.complex(poles[i]).re >=0)
	// 		{
	// 			noUnstablePoles = false;
	// 			alert("This transfer function contains poles in the right-half plane and/or poles on the imaginary axis.  This application only computes the output signal for stable systems.  Keep in mind that for unstable systems the transient response never dies out, and the output of the system goes to infinity.");
	// 		}
	// }
	
	update_tf(arrayNumerator, arrayDenominator);
	updateSimulation(arrayNumerator, arrayDenominator);
	clearChart();
}

function updateSimulation(arrayNumerator, arrayDenominator){
	socket.emit('update_tf', [arrayNumerator, arrayDenominator]);
}

function clearChart(){
  var chart = $('#graph').highcharts();
  var seriesLength = chart.series.length;
  for(var i = seriesLength -1; i > -1; i--) {
      chart.series[i].setData([]);
  }
  chart.redraw()
  console.log('test');
}

$(function() {
	setup();
    console.log( "ready!" );
});

