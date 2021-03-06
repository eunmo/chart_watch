use LWP;
use feature 'unicode_strings';
use utf8;
use Encode;
use Mojo::DOM;
use Mojo::Collection;
use DateTime;
binmode(STDOUT, ":utf8");

my $yy = $ARGV[0];
my $mm = $ARGV[1];
my $dd = $ARGV[2];

my $date = DateTime->new( year => $yy, month => $mm, day => $dd )->truncate( to => 'week')->add( days => 4 );
my $base_date = DateTime->new( year => 1999, month => 12, day => 31);

my $dur = $date->delta_days( $base_date );

my $days = $dur->in_units('days');
my $chart_id = (10960 + $days) * 86400;
my $url = "https://www.offiziellecharts.de/charts/single/for-date-${chart_id}000";

my $browser = LWP::UserAgent->new();
my $response = $browser->get($url);
my $html = $response->content;
my $dom = Mojo::DOM->new($html);
my $rank = 1;

print "[";
for my $td ($dom->find('td[class*="ch-info"]')->each) {
  my $title = $td->find('span[class*="info-title"]')->first->text;
  my $artist = $td->find('span[class*="info-artist"]')->first->text;
  my $artist_norm = normalize_artist($artist);
  print ",\n" if $rank > 1;
  print "{ \"rank\": $rank, \"artist\": \"$artist_norm\", \"titles\": [";
  print separate_titles($title);
  print "]}";
  $rank++;
}

print "]";

sub separate_titles($)
{
  my $title = shift;

  if ($title eq "Do They Know It's Christmas? (Deutsche Version / 2014)" ||
    $title eq "One Day / Reckoning Song (Wankelmut Rmx)" ||
    $title eq "200 km/h") {
    return "\"$title\"";
  }

  my $count = 1;
  my @tokens = split(/\//, $title);

  my $titles = "";
  foreach my $token (@tokens) {
    my $token_norm = normalize_title($token);
    $titles .= ", " if $count > 1;	
    $titles .= "\"$token_norm\"";
    $count++;
  }

  return $titles;
}

sub normalize_title($)
{
  my $string = shift;
  $string = decode('utf-8', $string) unless utf8::is_utf8($string);

  $string =~ s/\s+$//g;
  $string =~ s/^\s+//g;
  $string =~ s/[\'’"]/`/g;

  return $string;
}

sub normalize_artist($)
{
  my $string = shift;
  $string = decode('utf-8', $string) unless utf8::is_utf8($string);

  $string =~ s/\s+$//g;
  $string =~ s/^\s+//g;
  $string =~ s/[\'’"]/`/g;

  return $string;
}
