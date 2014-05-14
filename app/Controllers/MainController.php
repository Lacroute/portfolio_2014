<?php

class MainController{
  
  function __construct(){
    $memory = scandir(F3::get('PROJECTS_FOLDER'));
    for($i=0; $i < count($memory); $i++) {
      $memory[$i] = substr($memory[$i], 0, -4);
    }
    $memory = array_slice($memory, 2);
    $memory = array_merge($memory, $memory);
    shuffle($memory);
    
    F3::set('memory', $memory);
    F3::set('test', '$memory');
  }

  function beforeRoute(){
    header('Access-Control-Allow-Origin: *');
  }

  function home(){
    F3::set('title', '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒');
    F3::set('base_url', F3::get('BASE_URL'));
    echo Template::instance()->render('home.htm');
  }

  function projectDetailsRaw(){
    $title = F3::get('PARAMS.project_id');
    F3::set('title', $title);

    $data = array(
      'title'    => $title,
      'project_id'    => $title,
      'template' => Template::instance()->render('templates/'.$title.'.htm')
    );


    echo(json_encode($data));
  }

  function getJson(){
    echo file_get_contents(F3::get("BASE_URL")."ui/dots.json");
  }


  function __destruct(){

  }
}
?>