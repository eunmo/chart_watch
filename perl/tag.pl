#!/usr/bin/perl
use MP3::Tag;
use Encode;
use Encode::KR;
use Encode::Guess;
use utf8;
binmode(STDOUT, ":utf8");

my $filename = $ARGV[0];
my $mp3 = MP3::Tag->new($filename);

$mp3->get_tags;
print "{";
print "\"title\": \"", convert_text($mp3->title()), "\", ";
print "\"track\": ", convert_number($mp3->track1()), ", ";
print "\"disk\": ", convert_number($mp3->disk1()), ", ";
print "\"artist\": \"", convert_text($mp3->artist()), "\", ";
print "\"album\": \"", convert_text($mp3->album()), "\", ";
print "\"year\": ", convert_number($mp3->year()), ", ";
print "\"genre\": \"", convert_text($mp3->genre()), "\"";
print "}";
$mp3->close();

sub convert_number {
	my $num = shift;

	return 0 if (!defined $num || $num eq "");
	return $num;
}

sub convert_text {
	my $text = shift;

	return "" if (!defined $text || $text eq "");

	my $enc = guess_encoding($text, qw/cp949 utf-8/);

	$text = decode($enc->name, $text) unless utf8::is_utf8($text);
	return $text;
}
