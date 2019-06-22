<?php 
	if($_POST["submitted"]){
		$e=$_POST["email"];
		$p=$_POST["password"];
		if(strlen($e)>0 && strlen($p)>0){
			$con=mysqli_connect("localhost", "liang12l", "123456", "liang12l");
			if(!$con){
				exit("Could not connect:".mysqli_connect_error());
			}
			$q = "SELECT userId, firstName, lastName FROM Users
				WHERE email = '$e' AND password = '$p'";
			$result = mysqli_query($con, $q);
			if(mysqli_num_rows($result)>0){
				session_start();
				$_SESSION["logged_in"]=1;
				$row = mysqli_fetch_assoc($result);
				$_SESSION["userId"]=$row["userId"];
				$_SESSION["firstName"]=$row["firstName"];
				$_SESSION["lastName"]=$row["lastName"];
				header("location:communication.php");
			}else{
				$error_message = "Wrong Username or Password!";
			}
			mysqli_free_result($result);
			mysqli_close($con);
	   }
	}
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns = "http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<title>Liang's Web</title>
	<link rel="stylesheet" type="text/css" href = "project.css"/>
	<link rel="stylesheet" type="text/css" href = "login.css"/>
	<script type="text/javascript" src="login.js"> </script>
</head>
<body>

<article class="login">
<header>
	<h1>EDUCATOR</h1>
	<nav>CS875 DATABASE PROGRAMMING PROJECT</nav>
</header>

<h1>LOGIN</h1>
<form action="login.php" method="post" id="loginForm">
<input type="hidden" name="submitted" value="1">
<p class = "error"><?php echo $error_message?></p>
<aside>USERNAME <input type="text" size="20" name="email" id="email_id" /></aside>
<aside id="error1"></aside>
<aside>PASSWORD <input type="password" size="20" name="password" id="pwd_id" /></aside>
<aside id="error2"></aside>
<aside><button type="submit">Login</button></aside>
</form>

<section id="display"></section>

<script>
function display(){
       var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                document.getElementById("display").innerHTML = this.responseText;
            }
        }
        xmlhttp.open("GET", "sqlphp.php", true);
        xmlhttp.send();
}
document.addEventListener("DOMContentLoaded", display, false);  
</script>

<footer>
<p>Created by <i>Lingfeng Liang</i><br />
Last Updated: August 8, 2016</p>
</footer>
</article>

<script type="text/javascript" src="loginr.js"> </script>
</body>
</html>
