require 'test_helper'

class ApiControllerTest < ActionController::TestCase
  test "should get pagination" do
    get :pagination
    assert_response :success
  end

end
