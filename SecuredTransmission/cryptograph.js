var receiver = {};//create receiver object for decryption

class RC4state {
    //class constructor function, initiate state (S,i,j)
    constructor(){
	this.i = 0;//class member: record the i position
	this.j = 0;//class member: record the j position
	this.s = [];//class member: record the state array
	//initiate state array by signing 0->255 to s[]
    	for (var a = 0; a < 256; a++)
	    this.s[a]=a;
    }
    //member function: Key Scheduling Algorithm
    ksa(key){
	var b = 0;
    	for (var a = 0; a < 256; a++){
		b = (b + this.s[a] + key[a % key.length]) % 256;
		[this.s[a],this.s[b]]=[this.s[b],this.s[a]];
    	}
    }	
    //member function: Pseudo-Random Generation Algorithm
    prga(times) {
    	for (var a = 0; a < times; a++){
    		this.i = (this.i + 1) % 256;
    		this.j = (this.j + this.s[this.i]) % 256;
    		[this.s[this.i],this.s[this.j]]
			=[this.s[this.j],this.s[this.i]];
	}
	return this.s[(this.s[this.i] + this.s[this.j])%256];
    }
    //member function: invert prga, back ward r steps
    iprga(times) {
    	for (var a = 0; a < times; a++){
    		[this.s[this.i],this.s[this.j]]
			=[this.s[this.j],this.s[this.i]];
    		this.j = (this.j - this.s[this.i] + 256) % 256;
    		this.i = (this.i - 1) % 256;
    		if (this.i < 0)
	    		this.i += 256;
    	}
    }
    //member function: like prga(r) but use in Hash function
    prgaH(times) {
	var a = 0;
	var b = 0;
    	for (var c = 0; c < times; c++){
    		a = (a + 1) % 256;
    		b = (b + this.s[a]) % 256;
    		[this.s[a],this.s[b]]
			=[this.s[b],this.s[a]];
	}
    }
    //member function: return the class member, state array
    state(){
	return this.s;
    }
}

// major operation to split input text
function splitText(){
    var plaintext = document.getElementById("data").value;
    var sender = {};

    sender.offset = document.getElementById("sender_offset").value;
    sender.key = document.getElementById("sender_key").value;
    receiver.offset = document.getElementById("receiver_offset").value;
    receiver.key = document.getElementById("receiver_key").value;
    receiver.case = caseValue();

    var segment = split(padding(plaintext)); 
    
    var sender_interface = document.getElementById("sender");
    var receiver_interface = document.getElementById("receiver");

    removeElement("sender");
    removeElement("receiver");

    var key = toDecimal(sender.key);
    sender_interface.innerHTML = printSegment(segment);
    receiver_interface.innerHTML = "<textarea>Waiting for sender's message ...";

    var button = createButton(sender_interface, "create hash");
    button.addEventListener("click", function(){createHash(sender, key, segment)}, false);
}

/*subfunction of splitText*/

//This function translates text to ASCII code and padding data
function padding(data){
    var code = [];
    for(var i = 0; i < data.length; i++)
	code[i] = data.charCodeAt(i); 
    var l = data.length % 252;
    if(l!=0){
	code[i] = 1;
	l++;
    	for(; l < 252; l++)
	    code[++i]=0;
    }
    return code;
}

//This function splits data into segment , each segment has 252 bytes
function split(code){
    var i, j;
    var segment = [];
    for(i = 0; i < code.length/252; i++){
	segment[i] = [];
	for(j = 0; j < 252; j++)
	    segment[i][j] = code[i*252+j];
    }
    return segment;
}

//This function parses string and translate hexadecimal to decima
function toDecimal(str){
   var number = [];
   for(var i = 0; i < str.length; i++){
	if(i%2==0)
	    number[i/2] = 16*toHexa(str.toUpperCase().charCodeAt(i));
	else
	    number[(i-1)/2] += toHexa(str.toUpperCase().charCodeAt(i));
   }
   return number;
}

//This function translates ASCII char to number
function toHexa(number){
    if(number >= 48 && number <= 57)
	return number - 48;
    else if(number >= 65 && number <= 70)
	return number - 55;
    else
	return 0;
}

// major operation to create hash
function createHash(sender, key, segment){
    for(var i = 0; i < segment.length; i++)
	Hash([0,0,0,i], segment[i], sender.offset); 

    var sender_interface = document.getElementById("sender");
    removeElement("sender");
    sender_interface.innerHTML = printSegment(segment);

    var button = createButton(sender_interface, "encrypt");
    button.addEventListener("click", function(){encryption(key, segment)}, false);
}

/* subfunction of createHash ()*/

//This subfunction calculates RC4hash (sc #|| segment)
function Hash(sc, array, offset){
   var message = compress(sc.concat(array.slice(0,252)), offset);
   let RC4object = new RC4state;
   RC4object.ksa(message);
   var bin = RC4object.prga(256); //catch the useless return value
   var singlehash = 0;
   for(var j = 0; j < 256; j++)
	message[j] ^= RC4object.prga(1);
   for(var j = 0; j < 128; j++){   	
	if(j % 8 == 7){
	    singlehash += message[2*j] % 2;
	    array.push(singlehash);
	    singlehash = 0;
	} else
	    singlehash += (message[2*j] % 2)*Math.pow(2, (7 - j % 8));		
    }	
}

// This subfunction is the compress process in the project appendix
function compress(array, offset){
   let RC4object = new RC4state;
   var firstRun = 0;

   appending(array);
   for (var a = 0; a < array.length/64; a++){
   	var substate = array.slice(a*64, (a+1)*64);
   	var statelength = substate .reduce((j, k) => (j + k)) % 256;
   	RC4object.ksa(substate);
	if (firstRun == 0){
   	    RC4object.prgaH(offset);
	    firstRun++;
	}
   	if (statelength==0)
	    RC4object.prgaH(offset);
   	else
	    RC4object.prgaH(statelength);
   }
   return RC4object.state();
}

// This subfunciton append padding and divide padded message
function appending(array){
    var msglen = array.length;
    array.push(1);
    for(var i = 1; i <= addZero(61-msglen%64); i++)
	array.push(0);
    array.push(msglen / 256);
    array.push(msglen % 256);
}

//This subfunction calculate add how many zeros
function addZero(different){
    if(different==-1)
	return 63;
    else if(different==-2)
	return 62;
    else
	return different;
}

//major operation to encrypt data with key
function encryption(key, segment){ 
    var order = getOrder(1, segment.length);
    var text = "<textarea>";
    text += XORs(key, order, segment);
    text += "</textarea><br>";
    removeElement("sender");

    var sender_interface = document.getElementById("sender");            
    sender_interface.innerHTML = text;
	
    var button = createButton(sender_interface, "send");
    button.addEventListener("click", function(){decryption(segment)}, false);   
}

/* subfunction of encrytion()*/

//This subfunction operates the key XOR segments by given order
function XORs(key, order, segment){
    let RC4object = new RC4state();
    var text = "";
    var temp = 0;
    RC4object.ksa(key);
    for(var i = 0; i < segment.length; i++ ){
	XOR(order[i]-i-temp, RC4object, segment[order[i]]);
	temp = order[i]-i;
	text += print(segment[order[i]], order[i]);
    }
    return text;
}

//This subfunction operates Key XOR each segment
function XOR(difference, streamkey, array){
    if(difference > 0)
 	var bin = streamkey.prga(difference*268);//catch the useless key
    else if(difference < 0)
	streamkey.iprga(difference*(-268));
    for(var j = 0; j < 268; j++)
	array[j] ^= streamkey.prga(1);
}

//major operation to decrypt ciphertext with key
function decryption(segment){
    var key = toDecimal(receiver.key);
    var order = getOrder(receiver.case, segment.length);
    var temp = [];
    var t = 0;
    var is_equal;
    var text = "<textarea>";
    let RC4object = new RC4state();
    RC4object.ksa(key);
    for(i = 0; i < segment.length; i++ ){
	text += "SC(receiver):" + "0,0,0," + i + "\t";
	XOR(order[i]-i-t, RC4object, segment[order[i]]);
	t = order[i]-i;
	temp = segment[order[i]].slice(0,252);
	Hash([0,0,0,order[i]], temp, receiver.offset);
	text += print(segment[order[i]], order[i]);
	is_equal = isEqual
	    (temp.slice(252,268),segment[order[i]].slice(252,268));
	if(!is_equal){
	    text += "receiver's hash value: " + temp.slice(252,268)
		+ "\n\nStop!\n"
		+ "\nThe hash values from sender and receiver are not matched\n"
		+ "Please check key and offset on both side!\n"
		+ "Also request the sender to resend the packet";
	    break;
	}
    }
    text += "</textarea><br>";
    removeElement("sender"); 

    var sender_interface = document.getElementById("sender");
	sender_interface.innerHTML = "<textarea>Transmission completed";
    var receiver_interface = document.getElementById("receiver");
	receiver_interface.innerHTML = text;

    if(is_equal){
	var button = createButton(receiver_interface, "recover");
	button.addEventListener("click", function(){recover(segment)}, false);
    } else {
	var button = createButton(receiver_interface, "resend");
	button.addEventListener("click", resend, false);
    }
}

/* subfunction of decrytion()*/

//This subfunction generate the message receive order
function getOrder(caseNumber, NofSegment){
    var i;
    var order = [];
    if(caseNumber == 1)
	for(i = 0; i < NofSegment; i++)
	    order[i] = i;
    else if(caseNumber == 2)
	for(i = 0; i < NofSegment; i++){
	    if (i == NofSegment-1 && NofSegment%2 == 1)
		order[i] = i;
	    else
	    	order[i] = i + Math.pow(-1,i);
	}
    else if(caseNumber == 3)
	for(i = 0; i < NofSegment; i++)
	    order[i] = NofSegment - 1 - i;
    else{
	for(i = 0; i < NofSegment; i++)
	    order[i] = i;
	shuffle(order);
    }
    return order;	
}

//This subfunction generate a random order
function shuffle(order) {
    for (var i = order.length; i; i--) {
        var j = Math.floor(Math.random() * i);
        [order[i - 1], order[j]] = [order[j], order[i - 1]];
    }
}

//This subfunction compare sender and receiver hash
function isEqual(array1, array2){
    return array1.join(',') === array2.join(',');
}

//This subfunction recover plaintext from ASCII code
function recover(segment){
    var text = "<textarea>";
    for (var i = 0; i < segment.length; i++)
	for (var j = 0; j < 252; j++){
	    if(segment[i][j]==1)
		break;
	    text += String.fromCharCode(segment[i][j]);
	}
    text += "</textarea><br>";

    var receiver_interface = document.getElementById("receiver");
    removeElement("receiver");        
    receiver_interface.innerHTML = text;
}

//This subfunction reload the page, simulate resend function
function resend() {
    location.reload();
}

//This subfunction print message in ASCII code
function printSegment(segment){
    var text = "<textarea>";
    for(var i = 0; i < segment.length; i++ ){
	text += print(segment[i], i);
    }
    text += "</textarea><br>";
    return text;
}

//This subfunction print print each segment in ASCII code
function print(array, i){
    var text = "SC(message): 0,0,0," + i + "\nPlaintext:"
	+ array.slice(0,252) + "\n";
    if(array[252] != null)
	text += "Hash value: " + array.slice(252,268) + "\n";
    text += "\n";
    return text; 
}


//This subfunction clear output in a specific section
function removeElement(name){
    var y = document.getElementById(name);
    while (y.hasChildNodes()) {   
    	y.removeChild(y.firstChild);
    }
}

//This subfunction add button name to button
function createButton(position, name){
    var button = document.createElement("button");	
    var text = document.createTextNode(name);	
    button.appendChild(text);
    position.appendChild(button);
    return button;
}

//This function count the number of charactors
function count(event){
    document.getElementById("showNumber").innerHTML 
	= event.value.length + ' bytes';
}

//This function return the option value
function caseValue(){
    if(document.getElementById("case1").checked)
	return 1;
    if(document.getElementById("case2").checked)
	return 2;
    if(document.getElementById("case3").checked)
	return 3;
    if(document.getElementById("case4").checked)
	return 4;
}
