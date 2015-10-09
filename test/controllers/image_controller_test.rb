require 'test_helper'

class ImageControllerTest < ActionController::TestCase
  test "should get medium" do
    get :medium
    assert_response :success
  end

end
