function circular_navigation_shortcode($atts) {
    $atts = shortcode_atts(array(
        'post_type' => 'dilemma-posts',
    ), $atts);

    wp_enqueue_script('d3-script', 'https://d3js.org/d3.v7.min.js', array(), null, true);
    wp_enqueue_script('circular-nav-script', get_stylesheet_directory_uri() . '/js/circular-navigation.js', array('d3-script', 'jquery'), time(), true);
    wp_enqueue_style('circular-nav-style', get_stylesheet_directory_uri() . '/css/circular-navigation.css', array(), time());
    
    wp_localize_script('circular-nav-script', 'circularNavData', array(
        'ajaxurl' => admin_url('admin-ajax.php'),
        'post_type' => $atts['post_type'],
        'nonce' => wp_create_nonce('circular_nav_nonce'),
    ));

    return '
    <div class="circular-navigation-container">
        <svg id="circular-nav-svg" width="100%" height="100%" viewBox="-500 -400 1000 800" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
    ';
}
add_shortcode('circular_navigation', 'circular_navigation_shortcode');

function fetch_post_content() {
    check_ajax_referer('circular_nav_nonce', 'nonce');
    $post_id = intval($_POST['post_id']);
    $post = get_post($post_id);
    if ($post) {
        wp_send_json_success(array(
            'title' => $post->post_title,
            'content' => apply_filters('the_content', $post->post_content),
        ));
    } else {
        wp_send_json_error('Post not found');
    }
}
add_action('wp_ajax_fetch_post_content', 'fetch_post_content');
add_action('wp_ajax_nopriv_fetch_post_content', 'fetch_post_content');

function get_hierarchical_posts($post_type = 'dilemma-posts') {
    $args = array(
        'post_type' => $post_type,
        'posts_per_page' => -1,
        'orderby' => 'menu_order',
        'order' => 'ASC',
        'post_parent' => 0 // Get only top-level posts
    );
    $posts = get_posts($args);

    if (empty($posts)) {
        return null;
    }

    // Use the first top-level post as the root
    $root_post = $posts[0];
    $hierarchical_data = array(
        'name' => $root_post->post_title,
        'id' => $root_post->ID,
        'info' => wp_trim_words($root_post->post_content, 20),
        'children' => array(),
    );

    // Get all child posts of the root post
    $children = get_posts(array(
        'post_type' => $post_type,
        'posts_per_page' => -1,
        'post_parent' => $root_post->ID,
        'orderby' => 'menu_order',
        'order' => 'ASC'
    ));

    foreach ($children as $child) {
        add_post_to_hierarchy($hierarchical_data['children'], $child);
    }

    return $hierarchical_data;
}

function add_post_to_hierarchy(&$children, $post) {
    $post_data = array(
        'name' => $post->post_title,
        'id' => $post->ID,
        'info' => wp_trim_words($post->post_content, 20),
        'children' => array(),
    );

    $grandchildren = get_posts(array(
        'post_type' => $post->post_type,
        'posts_per_page' => -1,
        'post_parent' => $post->ID,
        'orderby' => 'menu_order',
        'order' => 'ASC'
    ));

    foreach ($grandchildren as $grandchild) {
        add_post_to_hierarchy($post_data['children'], $grandchild);
    }

    $children[] = $post_data;
}

function fetch_hierarchical_posts() {
    check_ajax_referer('circular_nav_nonce', 'nonce');
    $post_type = $_POST['post_type'];
    $data = get_hierarchical_posts($post_type);
    wp_send_json_success($data);
}
add_action('wp_ajax_fetch_hierarchical_posts', 'fetch_hierarchical_posts');
add_action('wp_ajax_nopriv_fetch_hierarchical_posts', 'fetch_hierarchical_posts');

function d3_test_shortcode() {
    // Enqueue D3.js
    wp_enqueue_script('d3-script', 'https://d3js.org/d3.v7.min.js', array(), null, true);
    
    // Enqueue our custom script
    wp_enqueue_script('d3-test-script', get_stylesheet_directory_uri() . '/js/d3-test.js', array('d3-script'), '1.0', true);
    
    // Return the HTML for our test visualization
    return '<div id="d3-test-container" style="width: 300px; height: 300px;"></div>';
}
add_shortcode('d3_test', 'd3_test_shortcode');

add_action('rest_api_init', function () {
    register_rest_route('my-custom-route/v1', '/elementor-content/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'get_elementor_content',
        'permission_callback' => '__return_true',
        'args' => array(
            'id' => array(
                'validate_callback' => function($param, $request, $key) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

function get_elementor_content($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);

    if (!$post) {
        return new WP_Error('no_post', 'Post not found', array('status' => 404));
    }

    if (class_exists('\Elementor\Plugin')) {
        $frontend = new \Elementor\Frontend();
        $content = $frontend->get_builder_content_for_display( $post_id, $with_css = true );
    } else {
        $content = apply_filters('the_content', $post->post_content);
    }

    $version = get_post_modified_time('U', true, $post_id);

    return array(
        'content' => $content,
        'version' => $version
    );
}
